
from database import get_connection

connection = get_connection()

if connection.is_connected():
    print("Successfully connected to MySQL!")

connection.close()
