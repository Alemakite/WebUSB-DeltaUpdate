import React, { Component } from "react";

export default class notifTable extends Component {
  constructor(props) {
    super(props);
    this.state = { notifs: ["rosie", "boujie", "nasty"] };
  }

  addNotif(newNotif) {
    this.setState((state) => ({ notifs: notifs.push(newNotif) }));
  }

  clear() {
    this.setState((state) => ({ notifs: (notifs.length = 0) }));
  }

  render() {
    return (
      <div
      // style={{
      //   display: "flex",
      //   flexDirection: "row",
      //   alignItems: "flex-start",
      //   gap: 15,
      //   marginTop: 30,
      // }}
      >
        <h1> Does this even work????</h1>
      </div>
    );
  }
}
