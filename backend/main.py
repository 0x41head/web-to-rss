from typing import Union
from fastapi import FastAPI
import firebase_admin
from firebase_admin import firestore, credentials
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import json
import xml.etree.ElementTree as ET
import requests
from bs4 import BeautifulSoup
from datetime import datetime
from urllib3 import request

# Initialization of DB + API Server
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

cred = credentials.Certificate("./kagi-demo-firebase-adminsdk-yy469-9ebf643ee2.json")
try:
    firebase_admin.initialize_app(cred)
except ValueError as e:
    print(e)
db = firestore.client()

# Defining data models

class FeedBase(BaseModel):
    title: str
    url: str
    content:str
    date:str
    author: str

class FeedList(BaseModel):
    title:str
    url:str
    data: list[FeedBase]

@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.post("/add_feed")
async def addFeed(data:FeedList):
    doc_ref=db.collection("feed").document()
    feedJSON=json.loads(data.model_dump_json())
    tempFeedJSONdata=feedJSON['data']
    for feed in tempFeedJSONdata:
        feed['timestamp']=int((datetime.strptime(feed['date'], '%a, %d %b %Y')).strftime('%s'))

    feedJSON['data']=tempFeedJSONdata
    doc_ref.set(feedJSON)
    return data

@app.get("/get_all_feeds")
async def getAllFeeds():
    docs=(db.collection("feed").stream())
    arrayOfFeedObjects=[]
    for doc in docs:
        feedObject=doc.to_dict()
        arrayOfFeedObjects.append(feedObject)

    return arrayOfFeedObjects

@app.post("/detect_feeds")
async def detectFeeds(url:str):
    response={}
    rss_feed_sites=['/rss.xml','/feed.rss']
    xmlData={'status_code':500}
    print('here')
    for rss_feed in rss_feed_sites:
        xmlData = request("GET",url + rss_feed)
        if xmlData.status == 200:
            break


    response['title']='title'
    response['url']='url'
    if xmlData.status == 200:
        root = ET.fromstring(xmlData.data)

        response['data']={}
        allFeeds=root.find('channel')
        response['title']=allFeeds.find('title').text
        response['url']=allFeeds.find('link').text
        # name = root.getElementsByTagName("item")[0]
        # print(root.findall('item'))
        feedArr=[]
        lArr=[]
        for feed in allFeeds.findall('item'):
            feedData={}
            feedData['title']=feed.find('title').text
            feedData['url']=feed.find('link').text
            try:
                feedData['content']=feed.find('description').text
            except:
                feedData['content']=findWebsiteContent(feedData['url'])
                # feedData['content']=None
            feedData['date']=feed.find('pubDate').text[0:16]
            feedData['author']=response['title']
            feedArr.append(feedData)

        response['data']=feedArr
    else:
        response['data']=[{'title':'thisIsASampleTitle','url':'url','content':"<div> content </div>",'date':'date','author':'author'}]

    # doc = minidom.parse("sample.xml")
    return response


def findWebsiteContent(url):
    headers = {'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.246"}
    r = requests.get(url,headers=headers)
    soup = BeautifulSoup(r.content, 'html.parser')
    a=str(soup.find('div',attrs={'class':'post'}))
    return a
