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

