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
import re
from collections import OrderedDict

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
    feedName:str

class SelectedFeedBaseObject(BaseModel):
    url:str
    classList:list[str]
    element:str

class SelectedFeedBase(BaseModel):
    title: SelectedFeedBaseObject
    content:SelectedFeedBaseObject
    date:SelectedFeedBaseObject
    author: SelectedFeedBaseObject


class FeedList(BaseModel):
    isEdited:bool
    title:str
    url:str
    data: list[FeedBase] | SelectedFeedBase

class Title(BaseModel):
    title:str
@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.post("/delete_feed")
async def deleteFeed(title:Title):
    docs=(db.collection("feed").stream())
    title=json.loads(title.model_dump_json())['title']
    print(title)
    for doc in docs:
        feedObject=doc.to_dict()
        if(feedObject['title']==title):
            try:
                doc_ref=db.collection("feed").document(doc.id)
                doc_ref.delete()
            except:
                print("couldn't del")

    return True

@app.post("/add_feed")
async def addFeed(data:FeedList):
    doc_ref=db.collection("feed").document()
    feedJSON={}
    if(data.isEdited):
        feedJSON=addSelectedData(data)
    else:
        feedJSON=json.loads(data.model_dump_json())
        tempFeedJSONdata=feedJSON['data']
        for feed in tempFeedJSONdata:
            try:
                feed['timestamp']=int((datetime.strptime(feed['date'], '%a, %d %b %Y')).strftime('%s'))
            except:
                tmpDate=feed['date'].strip()
                feed['date']=tmpDate[:5]+"0"+tmpDate[5:]
                # print(feed['date'])
                feed['timestamp']=int((datetime.strptime(feed['date'], '%a, %d %b %Y')).strftime('%s'))

        feedJSON['data']=tempFeedJSONdata[:20]
    doc_ref.set(feedJSON)
    return data

def addSelectedData(data:FeedList):
    feedJSON={}
    request_headers = {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    data_to_collect=json.loads(data.model_dump_json())['data']
    print(data_to_collect,"*************")
    mainPage =requests.get(data_to_collect['title']['url'],headers=request_headers)
    parsedMainWebPage = BeautifulSoup(mainPage.content, 'html.parser')
    feedJSON['title']=parsedMainWebPage.title.text
    feedJSON['url']=data_to_collect['title']['url']
    hrefToSearchFor=data_to_collect['content']['url'].replace(feedJSON['url'],'').split('/',1)[0]
    allFeedLinks=[]
    for link in parsedMainWebPage.find_all('a'):
        current_link=link.get('href')
        if hrefToSearchFor in current_link:
            if feedJSON['url'] in current_link:
                allFeedLinks.append(current_link)
            else:
                allFeedLinks.append(feedJSON['url'][:-1]+current_link)

    allFeedLinks=list(OrderedDict.fromkeys(allFeedLinks))
    cnt=0
    createFeedToInsertIntoDatabase=[]
    tmpObject={}
    all_titles=[]
    for title in parsedMainWebPage.find_all(data_to_collect['title']['element'],class_=data_to_collect['title']['classList'][0]):
        all_titles.append(title.text.strip().split('\n',1)[0].strip())
    for link in allFeedLinks:
        tmpLink=link
        pageHTML=request("GET","https://script.google.com/macros/s/AKfycbxQe09M50_NutxTaBCNOXumCTgKA9R1224X-TvjNHc-NNy9XrebVBUOKTDOnaPS1FWU/exec?content="+tmpLink)
        parsedHTML = BeautifulSoup(pageHTML.data, 'html.parser')
        print(pageHTML.status)
        try:
            date=parsedHTML.find(data_to_collect['date']['element'],class_=data_to_collect['date']['classList'][0]).text.replace(' ','').replace('\n','')[-10:]
            date=("0"+date if len(date)==10 else date)
            print(date)
            tmpObject={
            "author":parsedHTML.find(data_to_collect['author']['element'],class_=data_to_collect['author']['classList'][0]).text,
            "date":date ,
            "content": str(parsedHTML.find(data_to_collect['content']['element'],class_=data_to_collect['content']['classList'][0])),
            "url":data_to_collect['content']['url'],
            "title":all_titles[cnt],
            "timestamp":int((datetime.strptime(date.strip(), '%d-%b-%Y')).strftime('%s')),
            "feedName":feedJSON['title']
            }
        except:
            continue
        cnt+=1
        createFeedToInsertIntoDatabase.append(tmpObject)
    feedJSON['isEdited']=True
    feedJSON['data']=createFeedToInsertIntoDatabase
    return feedJSON

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
            feedData['feedName']=response['title']
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
