import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

sender_email = "techcouncilscse@gmail.com"
password = "cymewdteqojclvqy"  # App Password

def send_conf(user_name, hall_name, date, time, user_email):
    print("Sending confirmation email...")
    
    # Create email
    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = user_email
    msg['Subject'] = f"{hall_name} Booking Confirmation"

    body = f"""\ 
        Dear {user_name},

        We are pleased to inform you that your booking has been successfully confirmed.

        📌 Booking Details:
        - Hall: {hall_name}
        - Date: {date}
        - Time: {time}

        Please ensure that you arrive on time and carry any necessary permissions/documents related to your booking.
        For any assistance, feel free to contact the administration office.

        ⚠️ Note: This booking may be subject to cancellation if a priority booking arises. Please stay in touch with the office for any updates.

        Thank you for choosing our facilities.
        We look forward to hosting your event.

        Best regards,
        Jain (Deemed-to-be University) Administration
        """

    
    msg.attach(MIMEText(body, 'plain'))

    try:
        # Connect using STARTTLS
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.ehlo()
        server.starttls()  # Secure connection
        server.ehlo()
        server.login(sender_email, password)
        server.sendmail(sender_email, user_email, msg.as_string())
        server.quit()
        print(f"✅ Email sent successfully to {user_email}!")
    except Exception as e:
        print(f"❌ Failed to send email to {user_email}:", e)



def send_rej(user_name, hall_name, date, time, user_email, reason):
    print("Sending rejection email...")
    
    # Create email
    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = user_email
    msg['Subject'] = f"{hall_name} Booking Rejection"

    body = f"""\
Dear {user_name},
We regret to inform you that your booking request has been rejected due to {reason}.

📌 Booking Details:
- Hall: {hall_name}
- Date: {date}
- Time: {time}

For further information or assistance, please contact the administration office.
We apologize for any inconvenience this may cause.
Thank you for your understanding.

Best regards,
Jain (Deemed-to-be University) Administration
"""
    msg.attach(MIMEText(body, 'plain'))

    try:
        # Connect using STARTTLS
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.ehlo()
        server.starttls()  # Secure connection
        server.ehlo()
        server.login(sender_email, password)
        server.sendmail(sender_email, user_email, msg.as_string())
        server.quit()
        print(f"✅ Email sent successfully to {user_email}!")
    except Exception as e:
        print(f"❌ Failed to send email to {user_email}:", e)


def send_priority_conflict(user_name, hall_name, date, time, user_email, existing_booking_id):
    print("Sending priority booking conflict email...")
    
    # Create email
    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = user_email
    msg['Subject'] = f"Priority Booking Conflict - {hall_name}"

    body = f"""\
Dear {user_name},

We regret to inform you that your priority booking request could not be processed due to an existing booking conflict.

📌 Requested Booking Details:
- Hall: {hall_name}
- Date: {date}
- Time: {time}

❌ Conflict Reason:
There is already an existing booking (ID: {existing_booking_id}) for the same hall and time slot. Even priority bookings cannot override confirmed bookings without proper coordination.

🔄 Next Steps:
1. Please contact the administration office to discuss alternative time slots
2. We can help you find suitable alternatives for your event
3. If this is an emergency, please call the admin office directly

We apologize for any inconvenience this may cause and appreciate your understanding.

For immediate assistance, please contact:
📧 Email: admin@booking.com
📞 Phone: +91-XXX-XXX-XXXX

Best regards,
Jain (Deemed-to-be University) Administration
Priority Booking System
"""
    msg.attach(MIMEText(body, 'plain'))

    try:
        # Connect using STARTTLS
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.ehlo()
        server.starttls()  # Secure connection
        server.ehlo()
        server.login(sender_email, password)
        server.sendmail(sender_email, user_email, msg.as_string())
        server.quit()
        print(f"✅ Priority conflict email sent successfully to {user_email}!")
    except Exception as e:
        print(f"❌ Failed to send priority conflict email to {user_email}:", e)

