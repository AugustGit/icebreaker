import React, {Component} from 'react';
import axios from 'axios';
import Message from './Message.js';
import { Popover, PopoverHeader, PopoverBody, Button, Col, Container, Row , Badge, Tooltip } from 'reactstrap';
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import { faUserTimes } from '@fortawesome/fontawesome-free-solid'
import { faBars } from '@fortawesome/fontawesome-free-solid';
import { faCircle } from '@fortawesome/fontawesome-free-solid';


export default class ChatWindow extends Component {
    constructor(props) {

      super(props);
      this.toggle = this.toggle.bind(this);
      this.poptoggle = this.poptoggle.bind(this);
      this.state = {
          currentUser: 6,
          content: "",
          userlikesid: 0,
          userid: 0,
          timestamp: "",
          popoverOpen: false,
          tooltipOpen: false,
          allMessages: [],
          oldMessagePost: "",
          lastMessageID: 0
          };
    }

    toggle() {
      this.setState({
        popoverOpen: !this.state.popoverOpen
      });
    }

    poptoggle() {
       this.setState({
      tooltipOpen: !this.state.tooltipOpen
    });
    }

    componentWillReceiveProps(props) {
      axios.get('/api/messages_db', {
        params: {
          userlikesid: props.userlikesid,
          currentUser: this.props.currentuserID
        }
      })
      .then(response => {
        console.log("past messages", response.data);
        this.setState({
            allMessages: response.data
        });
      })
      .catch(function (error) {
      console.log(error);
      });

    }

    componentDidMount(){

    }

  componentDidUpdate(prevProps) {
    // There is a new message in the state, scroll to bottom of list
    const objDiv = document.getElementById('current-chat');
    objDiv.scrollTop = objDiv.scrollHeight;
    axios.get('/api/messages_db', {
        params: {
          userlikesid: prevProps.userlikesid,
          currentUser: this.props.currentuserID
        }
      })
      .then(response => {
         if(response.data[response.data.length - 1].id !== this.state.lastMessageID){
        console.log("past messages", response.data)
        console.log("response.data.length - 1 ", response.data.length - 1 )
        console.log("response.data.length - 1 ", response.data[response.data.length - 1].id )
        ;
        this.setState({
            allMessages: response.data,
            lastMessageID: response.data[response.data.length - 1].id
        });
      }
      })
      .catch(function (error) {
      console.log(error);
      });
  }

   render () {
    var oldMessages = <div/>

      if(this.props.oldMessage === true) {
        console.log("True")
      oldMessages = this.state.allMessages.map((message, index) => {
          console.log("MESSAGE",message )
      if (message.userid === this.props.currentUser) {

          return <div className="bubble me" key={index}>{message.content}</div>
             } else {
         return <div className="bubble you" key={index}>{message.content}</div>

            }
          });
          }


    var lookingForMen = <span>  </span>
    var lookingForWomen = <span>  </span>
    var lookingForOther = <span>  </span>
       if(this.props.hasData && this.props.user2Info[0].lovemale){
        lookingForMen =
            <span className="lookingfor">
              💙
             </span>}
      if(this.props.hasData && this.props.user2Info[0].lovefemale){
        lookingForWomen =
            <span className="lookingfor">
              ❤️
             </span>}
      if(this.props.hasData && this.props.user2Info[0].loveother){
        lookingForOther =
            <span className="lookingfor">
              💚
             </span>}

    var chattingWith = "You have no Matches to Chat with";
    if (this.props.hasData) {
    var user= this.props.user2Info[0]
    console.log("Chatting with ", this.props.user2Info[0])

        chattingWith =
            <div className="top">
            <span>
            <img src={user.facebook_picture_url}  className="chatimg" />
            <span className="name">{user.first_name}  {user.last_name}</span>
            <a href="#" id="gender">{lookingForMen} {lookingForWomen} {lookingForOther}</a>
             <Tooltip placement="bottom" isOpen={this.state.tooltipOpen} target="gender" toggle={this.poptoggle}>
                 <FontAwesomeIcon style={{color: "red"}} icon={faCircle} /> Looking for Love with Women
                 <p/><FontAwesomeIcon style={{color: "blue"}} icon={faCircle} /> Looking for Love with Men
                 <p/><FontAwesomeIcon style={{color: "green"}} icon={faCircle} /> Looking for Love with "Other"
            </Tooltip>


            <Button id="Popover1" onClick={this.toggle}><FontAwesomeIcon icon={faBars} /></Button>
            <Popover placement="bottom" isOpen={this.state.popoverOpen} target="Popover1" toggle={this.toggle}>
            <PopoverHeader>{user.first_name} ({user.age} years old)</PopoverHeader>
            <PopoverBody>{user.description}</PopoverBody>
            </Popover>

             <span className="removeUser">
            <Button color="danger" alt="Remove Friend" onClick={this.props.removeFromFriends}  className="unfriend"><FontAwesomeIcon icon={faUserTimes} /></Button></span>
           </span>
            </div>

    }  else {

      chattingWith =
          <div className="top">
            <div style={{color: '#999', textAlign: 'center'}}>Select a friend to start chatting!
            <p><i>No friends yet? <a href="/Potentials">Go make some!</a></i></p>
            </div>
            </div>
     }


    const messages = this.props.messages.map((message) => {
      console.log( "Chat Window MESSAGE", message )
            return <Message message={message} key={message.key} currentUser= {this.props.currentUser} />
          });
    return (



    <Col sm={{ size: 7, offset: 5 }} style={{position: 'absolute', height: '80%'}} id="current-chat">
        <div className="right">
            {chattingWith}


            <div className="active-chat" style={{overflow: 'scroll', height: '80%'}}>


                <div className="conversation-start"><span/></div>

                    <p> {this.props.game.question} </p>
                     <p> {this.props.game.answer} </p>
                    <button className="cool-button3" onClick={this.props.getNewGame}> Get Another Mini-Game! </button>
                    <button className="cool-button3" onClick={this.props.sendGame}  value={this.props.game.question} > Send Game! </button>
                      <div>

                     {oldMessages}

                     </div>
              {messages}

            </div>

        </div>
    </Col>


    )
  }
}


