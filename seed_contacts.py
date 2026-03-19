"""
seed_contacts.py — Run this ONCE to add all MIT-WPU committee contacts to MongoDB.
Usage: python seed_contacts.py
Requires: pip install pymongo
"""
from pymongo import MongoClient
import uuid

MONGO_URI = "mongodb+srv://Himanshu_Raghav:Divyanshu1@clusterh.jhljyt2.mongodb.net/?retryWrites=true&w=majority&appName=ClusterH"
client = MongoClient(MONGO_URI)
db = client['mithya_sports']
contacts_collection = db['important_contacts']

# All MIT-WPU committee contacts
CONTACTS = [
    # ── Anti-Ragging Committee ──────────────────────────────────────
    {"name": "Dr. Bharat Chaudhari",   "role": "Chairman",          "department": "Anti-Ragging Committee",           "phone": "9823248505", "email": "bharat.chaudhari@mitwpu.edu.in",  "category": "Anti-Ragging"},
    {"name": "Dr. Vinod Jadhav",       "role": "Chairman",          "department": "Anti-Ragging / SC-ST Cell",        "phone": "9850299537", "email": "vinod.jadhav@mitwpu.edu.in",       "category": "Anti-Ragging"},
    {"name": "Dr. Anil Hiwale",        "role": "Chairman",          "department": "Anti-Ragging Committee",           "phone": "7350885289", "email": "anil.hiwale@mitwpu.edu.in",        "category": "Anti-Ragging"},
    {"name": "Mrs. Amruta Dixit",      "role": "Member",            "department": "Anti-Ragging Committee",           "phone": "9604853501", "email": "amruta.dixit@mitwpu.edu.in",       "category": "Anti-Ragging"},
    {"name": "Mr. Mahesh Mahajan",     "role": "Member",            "department": "Anti-Ragging Committee",           "phone": "9145001197", "email": "mahesh.mahajan@mitwpu.edu.in",     "category": "Anti-Ragging"},

    # ── Internal Complaints Committee (ICC) ────────────────────────
    {"name": "Dr. Ravikumar Chitnis",  "role": "Chairperson",       "department": "Internal Complaints Committee",    "phone": "9850041773", "email": "ravikumar.chitnis@mitwpu.edu.in",  "category": "ICC"},
    {"name": "Dr. Shilpa Paygude",     "role": "Chairperson",       "department": "Internal Complaints Committee",    "phone": "9422336323", "email": "shilpa.paygude@mitwpu.edu.in",     "category": "ICC"},
    {"name": "Dr. Aparna Pathak",      "role": "Member Secretary",  "department": "ICC / Students Grievance",         "phone": "9881020731", "email": "aparna.pathak@mitwpu.edu.in",      "category": "ICC"},
    {"name": "Dr. Meenal Pendse",      "role": "Member",            "department": "Internal Complaints Committee",    "phone": "9975096600", "email": "meenal.pendse@mitwpu.edu.in",      "category": "ICC"},
    {"name": "Dr. Pournima Inamdar",   "role": "Member",            "department": "Internal Complaints Committee",    "phone": "9158544570", "email": "pournima.inamdar@mitwpu.edu.in",   "category": "ICC"},
    {"name": "Mrs. Suvarna Ranade",    "role": "Member",            "department": "Internal Complaints Committee",    "phone": "9421037489", "email": "suvarna.ranade@mitwpu.edu.in",     "category": "ICC"},
    {"name": "Dr. Mrunal Annadate",    "role": "Member",            "department": "Internal Complaints Committee",    "phone": "9890319199", "email": "mrunal.annadate@mitwpu.edu.in",    "category": "ICC"},
    {"name": "Mr. Arun Shinde",        "role": "Member",            "department": "Internal Complaints Committee",    "phone": "9822866999", "email": "arun.shinde@mitwpu.edu.in",        "category": "ICC"},
    {"name": "Dr. A. R. Chabukswar",   "role": "Member",            "department": "Internal Complaints Committee",    "phone": "9881073208", "email": "ar.chabukswar@mitwpu.edu.in",      "category": "ICC"},
    {"name": "Dr. Anjali Askhedkar",   "role": "Member",            "department": "Internal Complaints Committee",    "phone": "9850826663", "email": "anjali.askhedkar@mitwpu.edu.in",   "category": "ICC"},

    # ── Students Grievance Committee ──────────────────────────────
    {"name": "Dr. Abhijeet Dhere",     "role": "Member Secretary",  "department": "Students Grievance Committee",     "phone": "8087625020", "email": "abhijeet.dhere@mitwpu.edu.in",     "category": "Grievance"},
    {"name": "Dr. Shubhangi Gaikwad",  "role": "Member Secretary",  "department": "Students Grievance Committee",     "phone": "9860590933", "email": "shubhangi.gaikwad@mitwpu.edu.in",  "category": "Grievance"},
    {"name": "Dr. Sunil B. Somani",    "role": "Member Secretary",  "department": "Students Grievance Committee",     "phone": "9422501556", "email": "sunil.somani@mitwpu.edu.in",       "category": "Grievance"},
    {"name": "Mr. Ganesh Pokale",      "role": "Member Secretary",  "department": "Students Grievance Committee",     "phone": "9552598282", "email": "ganesh.pokale@mitwpu.edu.in",      "category": "Grievance"},

    # ── SC/ST Cell & Equal Opportunity Cell ───────────────────────
    {"name": "Mr. Gautam Narwade",     "role": "Member",            "department": "SC/ST Cell & Equal Opportunity",   "phone": "9422340246", "email": "gautam.narwade@mitwpu.edu.in",     "category": "SC-ST"},
    {"name": "Dr. Vinita Ahire",       "role": "Member",            "department": "SC/ST Cell & Equal Opportunity",   "phone": "8796075753", "email": "vinita.ahire@mitwpu.edu.in",       "category": "SC-ST"},
    {"name": "Mr. Sadanand Borse",     "role": "Member",            "department": "SC/ST Cell & Equal Opportunity",   "phone": "9922444227", "email": "sadanand.borse@mitwpu.edu.in",     "category": "SC-ST"},
    {"name": "Mr. Dilip Gaikwad",      "role": "Member",            "department": "SC/ST Cell & Equal Opportunity",   "phone": "9011178634", "email": "dilip.gaikwad@mitwpu.edu.in",      "category": "SC-ST"},

    # ── Employee Grievance Committee ──────────────────────────────
    {"name": "Dr. Deependra Sharma",   "role": "Member",            "department": "Employee Grievance / Board",       "phone": "8800467841", "email": "deependra.sharma@mitwpu.edu.in",   "category": "Grievance"},
    {"name": "Dr. Neeraj Mahindroo",   "role": "Member",            "department": "Employee Grievance / Board",       "phone": "9816017554", "email": "neeraj.mahindroo@mitwpu.edu.in",   "category": "Grievance"},
    {"name": "Dr. Rohini Kale",        "role": "Member",            "department": "Employee Grievance Committee",     "phone": "9890942780", "email": "rohini.kale@mitwpu.edu.in",        "category": "Grievance"},
    {"name": "Mr. Yogesh Shedge",      "role": "Member",            "department": "Employee Grievance Committee",     "phone": "7720061616", "email": "yogesh.shedge@mitwpu.edu.in",      "category": "Grievance"},
    {"name": "Dr. Nandkumar Nikam",    "role": "Member",            "department": "Employee Grievance Committee",     "phone": "",           "email": "nandkumar.nikam@mitwpu.edu.in",    "category": "Grievance"},

    # ── Liaison / Special Officers ────────────────────────────────
    {"name": "Dr. Vikrant Gaikwad",    "role": "Liaison / Anti-Discrimination Officer", "department": "MIT-WPU Administration", "phone": "7709198836", "email": "vikrant.gaikwad@mitwpu.edu.in", "category": "Admin"},
    {"name": "Dr. Nitin Khedkar",      "role": "Permanent Invitee Member",              "department": "MIT-WPU Administration", "phone": "9850828260", "email": "nitin.khedkar@mitwpu.edu.in",   "category": "Admin"},
    {"name": "Dr. Prasad Khandekar",   "role": "Special Invitee Member",               "department": "MIT-WPU Administration", "phone": "9168840404", "email": "prasad.khandekar@mitwpu.edu.in","category": "Admin"},
    {"name": "Dr. Dhrupa Bhatia",      "role": "Ladies Representative",                "department": "MIT-WPU Administration", "phone": "7620178951", "email": "dhrupa.bhatia@mitwpu.edu.in",   "category": "Admin"},
    {"name": "Adv. Eeshani Joshi",     "role": "Outside Member",                       "department": "Legal",                  "phone": "9421051709", "email": "eeshani.joshi@mitwpu.edu.in",   "category": "Admin"},

    # ── External Representatives ──────────────────────────────────
    {"name": "Mr. Sunil Kadam",        "role": "Parent Representative",  "department": "External",   "phone": "8016809423", "email": "sunil.kadam@mitwpu.edu.in",    "category": "Admin"},
    {"name": "Mr. Praveen Mandavkar",  "role": "Police Representative",  "department": "External",   "phone": "8668395149", "email": "praveen.mandavkar@mitwpu.edu.in","category": "Emergency"},
    {"name": "Mr. Harsh Dudhe",        "role": "Media Representative",   "department": "Media",      "phone": "9096332565", "email": "harsh.dudhe@mitwpu.edu.in",    "category": "Admin"},

    # ── Student Members / Representatives ─────────────────────────
    {"name": "Ms. Akshita Saxena",     "role": "Student Member",        "department": "Student Body",   "phone": "8130505946", "email": "akshita.saxena@mitwpu.edu.in",    "category": "Admin"},
    {"name": "Ms. Muskan Yadav",       "role": "Student Member",        "department": "Student Body",   "phone": "6375117876", "email": "muskan.yadav@mitwpu.edu.in",      "category": "Admin"},
    {"name": "Mr. Prithvi Raj Shinde", "role": "Student Member",        "department": "Student Body",   "phone": "7721882368", "email": "prithviraj.shinde@mitwpu.edu.in", "category": "Admin"},
    {"name": "Mr. Mayur Dhanwani",     "role": "Student Representative","department": "Student Body",   "phone": "9827098271", "email": "mayur.dhanwani@mitwpu.edu.in",    "category": "Admin"},
    {"name": "Mr. Prathmesh Jagdale",  "role": "Student Representative","department": "Student Body",   "phone": "9158163471", "email": "prathmesh.jagdale@mitwpu.edu.in", "category": "Admin"},
    {"name": "Ms. Debasmita Banik",    "role": "Student Representative","department": "Student Body",   "phone": "9362031143", "email": "debasmita.banik@mitwpu.edu.in",   "category": "Admin"},
    {"name": "Mr. Kuldeep Kadam",      "role": "Student Representative","department": "Student Body",   "phone": "7378353102", "email": "kuldeep.kadam@mitwpu.edu.in",     "category": "Admin"},
]

def seed():
    print(f"Seeding {len(CONTACTS)} contacts into MongoDB...")
    inserted = 0
    skipped = 0

    for c in CONTACTS:
        # Skip if already exists (match by name + role)
        if contacts_collection.find_one({"name": c["name"], "role": c["role"]}):
            print(f"  ⏭  Skip (exists): {c['name']}")
            skipped += 1
            continue

        contacts_collection.insert_one({
            "id": str(uuid.uuid4()),
            **c
        })
        print(f"  ✅ Added: {c['name']} ({c['category']})")
        inserted += 1

    print(f"\nDone! Inserted {inserted}, skipped {skipped} duplicates.")

if __name__ == '__main__':
    seed()
