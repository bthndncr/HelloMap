import React, { Component } from "react";
import L from "leaflet";
import Joi from "joi";
import { Map, TileLayer, Marker, Popup } from "react-leaflet";
import {
  Card,
  Button,
  Form,
  FormGroup,
  Input,
  Label,
  CardTitle,
  CardText
} from "reactstrap";
import "./App.css";
import userLocationIcon from "./user_location.svg";
import messageLocationIcon from "./message_location.svg";

const myIcon = L.icon({
  iconUrl: userLocationIcon,
  iconSize: [50, 82],
  iconAnchor: [25, 82],
  popupAnchor: [0, -82]
});

const messageIcon = L.icon({
  iconUrl: messageLocationIcon,
  iconSize: [50, 82],
  iconAnchor: [25, 82],
  popupAnchor: [0, -82]
});

const schema = Joi.object().keys({
  name: Joi.string()
    .min(2)
    .max(100)
    .required(),
  message: Joi.string()
    .min(2)
    .max(500)
    .required()
});

const API_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:5000/api/v1/messages"
    : "production-url-here";

class App extends Component {
  state = {
    location: {
      lat: 51.505,
      lng: -0.09
    },
    haveUsersLocation: false,
    zoom: 2,
    userMessage: {
      name: "",
      message: ""
    },
    sendingMessage: false,
    sentMessage: false,
    messages: []
  };

  componentDidMount() {
    // get all the messages
    fetch(API_URL)
      .then(res => res.json())
      .then(messages => {
        this.setState({
          messages
        });
      });

    navigator.geolocation.getCurrentPosition(
      position => {
        this.setState({
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          },
          haveUsersLocation: true,
          zoom: 13
        });
      },
      () => {
        console.log("uh oh.. they didn't give us their location");

        // get the location if the user doesn't give the location
        fetch("https://ipapi.co/json")
          .then(response => response.json())
          .then(location => {
            this.setState({
              location: {
                lat: location.latitude,
                lng: location.longitude
              },
              haveUsersLocation: true,
              zoom: 13
            });
          });
      }
    );
  }

  formIsValid = () => {
    const userMessage = {
      name: this.state.userMessage.name,
      message: this.state.userMessage.message
    };
    const result = Joi.validate(userMessage, schema);

    return !result.error && this.state.haveUsersLocation ? true : false;
  };

  formSubmitted = e => {
    e.preventDefault();

    if (this.formIsValid()) {
      this.setState({
        sendingMessage: true
      });
      fetch(API_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          name: this.state.userMessage.name,
          message: this.state.userMessage.message,
          latitude: this.state.location.lat,
          longitude: this.state.location.lng
        })
      })
        .then(response => response.json())
        .then(message => {
          console.log(message);
          setTimeout(() => {
            this.setState({
              sendingMessage: false,
              sentMessage: true
            });
          }, 3000);
        });
    }
  };

  valueChanged = e => {
    const { name, value } = e.target;
    this.setState(previous => ({
      userMessage: {
        ...previous.userMessage,
        [name]: value
      }
    }));
  };

  render() {
    const position = [this.state.location.lat, this.state.location.lng];
    return (
      <React.Fragment>
        <Map className="map" center={position} zoom={this.state.zoom}>
          <TileLayer
            attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {this.state.haveUsersLocation ? (
            <Marker position={position} icon={myIcon}></Marker>
          ) : (
            ""
          )}
          {this.state.messages.map(message => (
            <Marker
              key={message._id}
              position={[message.latitude, message.longitude]}
              icon={messageIcon}
            >
              <Popup>
                <em>{message.name}:</em> {message.message}
              </Popup>
            </Marker>
          ))}
        </Map>
        <Card body className="message-form">
          <CardTitle>Welcome to HelloMap!</CardTitle>
          <CardText>Leave a message with your location!</CardText>
          <CardText>Thanks for stopping by!</CardText>
          {!this.state.sendingMessage &&
          !this.state.sentMessage &&
          this.state.haveUsersLocation ? (
            <Form onSubmit={this.formSubmitted}>
              <FormGroup>
                <Label for="name">Name</Label>
                <Input
                  onChange={this.valueChanged}
                  type="text"
                  name="name"
                  id="name"
                  placeholder="Enter your name"
                />
              </FormGroup>
              <FormGroup>
                <Label for="name">Message</Label>
                <Input
                  onChange={this.valueChanged}
                  type="textarea"
                  name="message"
                  id="message"
                  placeholder="Enter your message"
                />
              </FormGroup>
              <Button type="submit" color="info" disabled={!this.formIsValid()}>
                Send
              </Button>
            </Form>
          ) : this.state.sendingMessage || !this.state.haveUsersLocation ? (
            <video
              autoPlay
              loop
              src="https://i.giphy.com/media/BCIRKxED2Y2JO/giphy.mp4"
            ></video>
          ) : (
            <CardText>Thanks for submitting a message!</CardText>
          )}
        </Card>
      </React.Fragment>
    );
  }
}

export default App;
