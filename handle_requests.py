from http.server import BaseHTTPRequestHandler, HTTPServer
import logging
import ast

import csv
import sys
import math
from geopy.distance import distance

import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import pdb

"""
Handle POST requests that are sent through the Submission of the Request Delivery Form on DronOrder FrontPage
    ./handle_requests.py [<port>]
"""

# Support functions
def haversine(coord1, coord2):
    R = 6372800  # Earth radius in meters
    lat1, lon1 = coord1
    lat2, lon2 = coord2
    
    phi1, phi2 = math.radians(lat1), math.radians(lat2) 
    dphi       = math.radians(lat2 - lat1)
    dlambda    = math.radians(lon2 - lon1)
    
    a = math.sin(dphi/2)**2 + \
        math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    
    return 2*R*math.atan2(math.sqrt(a), math.sqrt(1 - a))


class SearchAndSend:
    # Return row -> access row[4] for address, etc.
    def findPilots(self,startLat,startLng):
        pilotFile = "PILOT_BASIC_lat_long_full.csv"
        startCoord=startLat, startLng

        closest_pilot_rows=[0,0,0]
        
        with open(pilotFile) as csv_file:
            csv_reader = csv.reader(csv_file, delimiter=';')
            line_count = 0

            for row in csv_reader:
                if(line_count!=0):
                    if(len(row)>16):
                        # todo: remove this check with the next version
                        if(row[17]!=""):
                            itLat=float(row[16])
                            itLon=float(row[17])
                            itCoord=itLat,itLon

                            if(itLat!="0"):
                                distance=haversine(startCoord,itCoord)
                                row.append(distance)

                                if(distance<self.getDistanceOfPilotRow(closest_pilot_rows[0])):
                                    closest_pilot_rows[0]=row
                                elif(distance<self.getDistanceOfPilotRow(closest_pilot_rows[1])):
                                    closest_pilot_rows[1]=row
                                elif(distance<self.getDistanceOfPilotRow(closest_pilot_rows[2])):
                                    closest_pilot_rows[2]=row
                
                line_count += 1

        print(closest_pilot_rows)
        return closest_pilot_rows

    def getDistanceOfPilotRow(self,row):
        default_distance=10000000000000

        try:
            return row[-1]
        except:
            return default_distance

    def createPilotInformation(self,pilot_rows):
        pilotInformation=""
        for i,pilot_row in enumerate(pilot_rows): 
            firstName=pilot_row[1].capitalize()
            lastName=pilot_row[2].capitalize()
            #todo: street - big letter between white
            street=pilot_row[3].capitalize()
            
            city=pilot_row[5].capitalize()
            state=pilot_row[6]
            zipCode=pilot_row[7]
            distance=round(float(pilot_row[-1]),2)
            pilotInformation+=(f'\n{i+1})\n{firstName}, {lastName}\n{street}\n{city}, {state} {zipCode}\nDistance: {distance} m\n')
            # "https://www.google.com/maps/@49.406876,6.9686856,15z"
        return pilotInformation

    # Send Mail to Requester
    def sendMail(self,requesterMail, pilotInformation):
        # todo: add the pilot information 
        mail_content = '''Hello,

thank you for your request to schedule a drone delivery flight.
We found the following pilots in your area:
{}
These contacts are publicly available under: www.faa.gov/licenses_certificates/airmen_certification/

Unfortunately, we haven't received their e-mail address yet.
Since they are very close to you, could you try to contact them?

We appreciate your support.

Alex 
Your DronOrder Team'''.format(pilotInformation)
        #The mail addresses and password
        server_mail='info@dronorder.net'
        sender_address = server_mail
        sender_pass = 'AlexEppi95'
        receiver_address =requesterMail
       
        #Setup the MIME
        message = MIMEMultipart()
        message['From'] = sender_address
        message['To'] = receiver_address
        message['Cc'] = server_mail
        message['Subject'] = 'Your drone delivery request - DronOrder'   #The subject line
        #The body and the attachments for the mail
        message.attach(MIMEText(mail_content, 'plain'))
        #Create SMTP session for sending the mail
        session = smtplib.SMTP('smtp.strato.com', 587) #use gmail with port
        session.starttls() #enable security
        session.login(sender_address, sender_pass) #login with mail_id and password
        text = message.as_string()
        session.sendmail(sender_address, receiver_address, text)
        session.quit()
        logging.info('Mail sent!\n')


# Listening for new post requests
class HandlerClass(BaseHTTPRequestHandler):
    def _set_response(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()

    def do_GET(self):
        logging.info("GET request,\nPath: %s\nHeaders:\n%s\n", str(self.path), str(self.headers))
        self._set_response()
        self.wfile.write("GET request for {}".format(self.path).encode('utf-8'))

    def do_POST(self):
        logging.info('Got Request - should I handle?\n')
        
        if('h2881013.stratoserver.net:8081'==self.headers['Host']):
            content_length = int(self.headers['Content-Length']) # <--- Gets the size of data
            post_data = self.rfile.read(content_length) # <--- Gets the data itself
            logging.info("POST request,\nPath: %s\nHeaders:\n%s\n\nBody:\n%s\n",
                    str(self.path), str(self.headers), post_data.decode('utf-8'))

            self._set_response()
            self.wfile.write("POST request for {}".format(self.path).encode('utf-8'))
            # Start Main Process
            self.start_processing(post_data.decode('utf-8'))
    
    def start_processing(self, post_data):
        try:
            self.SearchAndSend= SearchAndSend()
            MsgDict=ast.literal_eval(post_data)

            # Input data        
            email=MsgDict['email']
            startLat=float(MsgDict['startLat'])
            startLng=float(MsgDict['startLng'])
            startTime=MsgDict['startTime']
            shippedItem=MsgDict['shippedItem']

            logging.info(shippedItem)

            PilotRows=self.SearchAndSend.findPilots(startLat,startLng)
            PilotInformation=self.SearchAndSend.createPilotInformation(PilotRows)

            result=self.SearchAndSend.sendMail(email,PilotInformation)
            print(result)
        except:
            return


def run( ):
    # Server settings
    # Choose port 8080, for port 80, which is normally used for a http server, you need root access
    logging.basicConfig(level=logging.INFO)
    server_address = ('', 8081)
    httpd = HTTPServer(server_address, HandlerClass)

    logging.info('Starting httpd...\n')
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    httpd.server_close()
    logging.info('Stopping httpd...\n')

if __name__ == '__main__':
    from sys import argv
    run()

sys.exit(0)
