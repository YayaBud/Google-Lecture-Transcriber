import os
from pymongo import MongoClient
from dotenv import load_dotenv
import sys

# Load environment variables
load_dotenv()

print("--- MongoDB Connection Test ---")

# 1. Get credentials
user_id = os.getenv('MONGODB_USER_ID')
password = os.getenv('MONGODB_PASSWORD')
url_template = os.getenv('MONGODB_URL')

print(f"User ID from env: {user_id}")
print(f"Password from env: {password}")
print(f"URL from env: {url_template}")

# 2. Construct URI
# If the URL already contains the user/pass, use it as is.
# Otherwise, replace placeholders.
if '<db_username>' in url_template:
    uri = url_template.replace('<db_username>', user_id).replace('<db_password>', password)
    print("Constructed URI from placeholders.")
else:
    uri = url_template
    print("Using URL from env as is (no placeholders found).")

# Ensure authSource is set (usually admin for Atlas)
if 'authSource' not in uri:
    if '?' in uri:
        uri += "&authSource=admin"
    else:
        uri += "?authSource=admin"
    print(f"Added authSource=admin. New URI: {uri.replace(password, '********')}")

# Mask password for printing
if password:
    masked_uri = uri.replace(password, '********')
else:
    masked_uri = uri
print(f"Testing connection to: {masked_uri}")

# 3. Connect
try:
    client = MongoClient(uri, serverSelectionTimeoutMS=5000)
    print("Client created. Attempting server_info() (triggers connection)...")
    info = client.server_info()
    print("SUCCESS: Connected to MongoDB!")
    print(f"Server version: {info.get('version')}")
    
    print("Attempting to list databases...")
    dbs = client.list_database_names()
    print(f"Databases: {dbs}")
    
except Exception as e:
    print("\nFAILURE: Could not connect to MongoDB.")
    print(f"Error type: {type(e).__name__}")
    print(f"Error message: {e}")
    if hasattr(e, 'details'):
        print(f"Error details: {e.details}")
