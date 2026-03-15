import requests
import sys
import json
import base64
import time
import urllib.parse
from datetime import datetime
from pymongo import MongoClient
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding='utf-8')

# ==========================================
# ⚙️ CONFIGURATION 
# ==========================================
SUPABASE_URL = "https://kmqhrlinvxqnipvvlvwv.supabase.co"
API_KEY = "sb_publishable_kitYyNDBQZI32jyejgStcQ_fuVgY12m" 

# Your login credentials
EMAIL = "1262253515@mitwpu.edu.in"
PASSWORD = "smart@1262253515" 
LOGIN_URL = "https://sports.mitwpu.edu.in/login"

# MongoDB Connection
MONGO_URI = "mongodb+srv://Himanshu_Raghav:Divyanshu1@clusterh.jhljyt2.mongodb.net/?appName=ClusterH"

print("Attempting to connect to MongoDB...")
try:
    client = MongoClient(MONGO_URI)
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
    print(f"\n[{datetime.now().strftime('%I:%M %p')}] 👻 Getting a fresh authentication token...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False) # Change to True later to hide the browser!
        context = browser.new_context()
        page = context.new_page()
        
        try:
            page.goto(LOGIN_URL)
            page.fill("input[type='email']", EMAIL)
            page.fill("input[type='password']", PASSWORD)
            page.click("button[type='submit']")
            
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(3000)
            
            auth_token = None
            
            # ATTEMPT 1: Check Cookies
            for cookie in context.cookies():
                if "sb-kmqhrlinvxqnipvvlvwv-auth-token" in cookie["name"]:
                    raw_base64 = cookie["value"].replace("base64-", "")
                    decoded_bytes = base64.b64decode(raw_base64 + "===") 
                    auth_token = json.loads(decoded_bytes.decode('utf-8')).get("access_token")
                    break
            
            # ATTEMPT 2: Check Local Storage
            if not auth_token:
                local_storage = json.loads(page.evaluate("() => JSON.stringify(window.localStorage)"))
                for key, value in local_storage.items():
                    if "sb-kmqhrlinvxqnipvvlvwv-auth-token" in key:
                        auth_token = json.loads(value).get("access_token")
                        break

            browser.close()
            if auth_token:
                print("✅ Token acquired successfully!")
                return auth_token
            else:
                print("❌ Failed to find token anywhere.")
                return None
                
        except Exception as e:
            print(f"Browser failed: {e}")
            browser.close()
            return None


# ==========================================
# 🤖 SCRAPE AND SAVE TO DATABASE
# ==========================================
def scrape_and_update_db(token):
    now = datetime.now()
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
        # 1. Fetch only ACTIVE sports
        sports_url = f"{SUPABASE_URL}/rest/v1/sports?select=*&is_active=eq.true"
        sports_response = requests.get(sports_url, headers=headers)
        
        # 🛡️ SAFETY CHECK: Did the college server crash or block us?
        if sports_response.status_code != 200:
            print(f"⚠️ College server returned an error: {sports_response.status_code}")
            return # Safely exit the function without crashing
            
        sports_data = sports_response.json()
        
        # 🛡️ SAFETY CHECK: Did they send a weird error message instead of a list?
        if not isinstance(sports_data, list):
            print("⚠️ College server is offline or sent unexpected data.")
            return

        # 2. Process the sports
        for target_sport in sports_data:
            sport_id = target_sport.get('id')
            sport_name = target_sport.get('name')
            total_seats = target_sport.get('capacity', 2)

            slots_response = requests.get(f"{SUPABASE_URL}/rest/v1/slots?select=*&sport_id=eq.{sport_id}", headers=headers)
            slots_data = slots_response.json()
            
            if not isinstance(slots_data, list):
                continue # Skip if data is bad

            for slot in slots_data:
                start_time_str = slot.get('start_time', '')
                end_time_str = slot.get('end_time', '')
                
                try:
                    slot_start_time = datetime.strptime(start_time_str, "%H:%M:%S").time()
                except:
                    continue 

                # SKIP past time slots
                if slot_start_time <= current_time:
                    continue 

                slot_id = slot.get('id')
                
                bookings_url = f"{SUPABASE_URL}/rest/v1/bookings?select=*&slot_id=eq.{slot_id}&booking_date=eq.{today_date}"
                bookings_response = requests.get(bookings_url, headers=headers)
                
                if bookings_response.status_code == 200:
                    bookings = bookings_response.json()
                    current_bookings = len(bookings) if isinstance(bookings, list) else total_seats
                    
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

        # 3. ALWAYS wipe old records so "ghost slots" disappear when the college closes bookings
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
# 🕒 THE MASTER TIME LOOP
# ==========================================
print("==========================================")
print("     🏅 MITHYA BACKGROUND WORKER RUNNING  ")
print("==========================================")

current_token = None
token_timestamp = None

while True:
    now = datetime.now()
    
    # 1. Manage the Token (Refresh if it's older than 50 minutes)
    if not current_token or not token_timestamp or (now - token_timestamp).total_seconds() > 3000:
        current_token = get_fresh_token()
        token_timestamp = datetime.now()
        
    # 2. Run the Scraper and update MongoDB
    if current_token:
        scrape_and_update_db(current_token)
    
    # 3. Time Schedule Logic (5 AM to 6 PM)
    if 5 <= now.hour < 18:
        print(f"⏳ Sleeping for 3 minutes... (Next run: {(datetime.now().timestamp() + 180)})")
        time.sleep(180) 
    else:
        print("🌙 Night Mode Active. Sleeping for 2 hours...")
        time.sleep(1200)