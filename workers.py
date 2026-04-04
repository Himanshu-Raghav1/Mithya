import requests
import sys
import json
import base64
import time
import gc
from datetime import datetime, timezone, timedelta
from pymongo import MongoClient
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding='utf-8')

# ==========================================
# ⏱️ TIMEZONE SETUP
# ==========================================
IST = timezone(timedelta(hours=5, minutes=30))

# ==========================================
# ⚙️ CONFIGURATION 
# ==========================================
# Note: In the future, you should move these to Render Environment Variables for security!
SUPABASE_URL = "https://kmqhrlinvxqnipvvlvwv.supabase.co"
API_KEY = "sb_publishable_kitYyNDBQZI32jyejgStcQ_fuVgY12m" 

EMAIL = "1262253515@mitwpu.edu.in"
PASSWORD = "smart@1262253515" 
LOGIN_URL = "https://sports.mitwpu.edu.in/login"

MONGO_URI = "mongodb+srv://Himanshu_Raghav:Divyanshu1@clusterh.jhljyt2.mongodb.net/?appName=ClusterH"

print("Attempting to connect to MongoDB...")
try:
    # 🛡️ FIX: Give MongoDB 10 seconds to connect before panicking
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=10000)
    db = client['mithya_sports'] 
    slots_collection = db['available_slots']
    client.admin.command('ping') 
    print("🔌 SUCCESS! Connected to MongoDB!")
except Exception as e:
    print(f"❌ ERROR: {e}")
    sys.exit(1)

# ==========================================
# 👻 GHOST BROWSER LOGIN
# ==========================================
def get_fresh_token():
    print(f"\n[{datetime.now(IST).strftime('%I:%M %p')}] 👻 Getting a fresh authentication token...")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=[
                '--disable-dev-shm-usage',
                '--no-sandbox',            
                '--disable-gpu',           
                '--disable-extensions',    
                '--single-process',        
                '--js-flags="--max-old-space-size=128"' 
            ]
        )
        context = browser.new_context()
        page = context.new_page()
        
        # 🛡️ RENDER FIX 1: THE MEMORY SAVER
        # This aborts loading any images, CSS, or fonts, saving massive amounts of RAM
        page.route("**/*", lambda route: route.abort() 
            if route.request.resource_type in ["image", "stylesheet", "font", "media"] 
            else route.continue_()
        )
        
        auth_token = None
        try:
            # 🛡️ FIX: Give the college 60 full seconds to load, don't use 'networkidle'
            page.goto(LOGIN_URL, timeout=60000)
            page.fill("input[type='email']", EMAIL)
            page.fill("input[type='password']", PASSWORD)
            page.click("button[type='submit']")
            
            page.wait_for_load_state("load", timeout=60000)
            page.wait_for_timeout(4000)
            
            for cookie in context.cookies():
                if "sb-kmqhrlinvxqnipvvlvwv-auth-token" in cookie["name"]:
                    raw_base64 = cookie["value"].replace("base64-", "")
                    decoded_bytes = base64.b64decode(raw_base64 + "===") 
                    auth_token = json.loads(decoded_bytes.decode('utf-8')).get("access_token")
                    break
            
            if not auth_token:
                local_storage = json.loads(page.evaluate("() => JSON.stringify(window.localStorage)"))
                for key, value in local_storage.items():
                    if "sb-kmqhrlinvxqnipvvlvwv-auth-token" in key:
                        auth_token = json.loads(value).get("access_token")
                        break

        except Exception as e:
            print(f"Browser failed: {e}")
        finally:
            page.close()
            context.close()
            browser.close()
            gc.collect() 

        if auth_token:
            print("✅ Token acquired successfully!")
        else:
            print("❌ Failed to find token anywhere.")
        return auth_token

# ==========================================
# 🤖 BULK SCRAPE AND SAVE TO DATABASE
# ==========================================
def scrape_and_update_db(token):
    now = datetime.now(IST)
    today_date = now.strftime("%Y-%m-%d")
    current_time = now.time()
    
    print(f"📡 Fetching live data from Mithya server...")
    
    headers = {
        "apikey": API_KEY,
        "Authorization": f"Bearer {token}",
        "accept": "application/json"
    }

    fresh_data_to_save = []

    try:
        # 🛡️ FIX: 15 Second Timeout
        sports_url = f"{SUPABASE_URL}/rest/v1/sports?select=*&is_active=eq.true"
        sports_response = requests.get(sports_url, headers=headers, timeout=15)
        
        if sports_response.status_code != 200:
            print(f"⚠️ College server returned an error: {sports_response.status_code}")
            return 
            
        sports_data = sports_response.json()

        for target_sport in sports_data:
            # 🚦 THE POLITE PAUSE
            time.sleep(1) 
            
            sport_id = target_sport.get('id')
            sport_name = target_sport.get('name')
            
            # 🛡️ FIX 1: Safe math! Prevents crashes if the college leaves capacity blank (null)
            seat_limit = target_sport.get('seat_limit')
            capacity = target_sport.get('capacity')
            total_seats = seat_limit if seat_limit is not None else (capacity if capacity is not None else 2)

            try:
                slots_response = requests.get(f"{SUPABASE_URL}/rest/v1/slots?select=*&sport_id=eq.{sport_id}", headers=headers, timeout=15)
                slots_data = slots_response.json()
            except Exception as e:
                print(f"⚠️ Timeout fetching slots for {sport_name}. Skipping to next sport.")
                continue
            
            if not isinstance(slots_data, list):
                continue 

            for slot in slots_data:
                # 🛑 FIX 2: THE ADMIN SHIELD
                # If the admin manually disabled the slot for maintenance (shows as 'Ended' early)
                if slot.get('is_active') is False or str(slot.get('status', '')).lower() in ['ended', 'inactive', 'closed']:
                    continue

                start_time_str = slot.get('start_time', '')
                end_time_str = slot.get('end_time', '')
                
                # 🛑 FIX 3: THE DATE CHECK
                if 'T' in start_time_str:
                    slot_date = start_time_str.split('T')[0]
                    if slot_date != today_date:
                        continue  # This slot is not for today! Skip it entirely.
                        
                try:
                    if 'T' in start_time_str:
                        time_part = start_time_str.split('T')[1].split('+')[0].split('Z')[0]
                        slot_start_time = datetime.strptime(time_part[:8], "%H:%M:%S").time()
                    else:
                        clean_time = start_time_str.split('+')[0].strip()
                        if len(clean_time) >= 8:
                            slot_start_time = datetime.strptime(clean_time[:8], "%H:%M:%S").time()
                        else:
                            slot_start_time = datetime.strptime(clean_time[:5], "%H:%M").time()
                except Exception as e:
                    continue 

                # Skip slots that have ALREADY started real-time today
                if slot_start_time < current_time:
                    continue 

                # The Badminton Kill-Switch (Keeps 7 PM+ ghosts away)
                if "badminton" in sport_name.lower():
                    cutoff_time = datetime.strptime("18:45:00", "%H:%M:%S").time()
                    if slot_start_time > cutoff_time:
                        continue 

                slot_id = slot.get('id')
                
                try:
                    bookings_url = f"{SUPABASE_URL}/rest/v1/bookings?select=*&slot_id=eq.{slot_id}&booking_date=eq.{today_date}"
                    bookings_response = requests.get(bookings_url, headers=headers, timeout=10)
                    
                    if bookings_response.status_code == 200:
                        bookings = bookings_response.json()
                        current_bookings = len(bookings) if isinstance(bookings, list) else total_seats
                    else:
                        current_bookings = total_seats 
                except Exception as e:
                    current_bookings = total_seats 

                if current_bookings < total_seats:
                    seats_left = total_seats - current_bookings
                    fresh_data_to_save.append({
                        "game_name": sport_name.lower(), 
                        "display_name": sport_name,
                        "start_time": start_time_str,
                        "end_time": end_time_str,
                        "seats_open": seats_left,
                        "last_updated": now.strftime("%Y-%m-%d %H:%M:%S")
                    })

        # WIPE AND SAVE
        print("🗑️ Wiping old database records...")
        slots_collection.delete_many({}) 

        if fresh_data_to_save:
            print(f"💾 Saving {len(fresh_data_to_save)} active, future slots to MongoDB...")
            slots_collection.insert_many(fresh_data_to_save) 
            print("✅ Database successfully updated!")
        else:
            print("⚠️ Bookings are closed or no slots left. Database is now empty.")

    except Exception as e:
        print(f"❌ An error occurred during the scan: {e}")

# ==========================================
# 🚀 INFINITE LOOP ENTRY POINT (Render Fix)
# ==========================================
if __name__ == "__main__":
    print("==========================================")
    print("   🏅 MITHYA SPORTS WORKER STARTING       ")
    print("==========================================")

    # 🛡️ RENDER FIX 2: THE INFINITE LOOP
    # This prevents the script from ever stopping, which stops Render from constantly restarting it
    while True:
        now = datetime.now(IST)
        
        if 0 <= now.hour < 4:
            print(f"\n[{now.strftime('%I:%M %p')} IST] 🌙 Night Mode — sleeping for 1 hour. Service resumes at 4:00 AM IST.")
            time.sleep(3600)  # Sleep for exactly 1 hour
            continue # Start the loop over without scraping
            
        print(f"\n--- Starting Scraping Cycle at {now.strftime('%I:%M %p')} IST ---")
        
        try:
            token = get_fresh_token()
            if token:
                scrape_and_update_db(token)
            else:
                print("❌ Failed to get auth token this round.")
        except Exception as e:
            print(f"❌ Worker encountered an error: {e}")
            
        # 💤 The crucial step: Sleep for 15 minutes before running again!
        print("💤 Job done. Worker sleeping for 15 minutes to save RAM...")
        time.sleep(900)