import React, { Component } from "react";
import axios from "axios";

class Fib extends Component {
  state = {
    seenIndexes: [],
    values: {},
    index: "",
  };

  componentDidMount() {
    this.fetchValues();
    this.fetchIndexes();
  }

  async fetchValues() {
    const values = await axios.get("/api/values/current");
    this.setState({ values: values.data });
  }

  async fetchIndexes() {
    const seenIndexes = await axios.get("/api/values/all");
    this.setState({
      seenIndexes: seenIndexes.data,
    });
  }

  handleSubmit = async (event) => {
    event.preventDefault();

    const submittedIndex = this.state.index;
    await axios.post("/api/values", {
      index: this.state.index,
    });
    this.setState({ index: "" });

    // Start polling for the result
    this.startPolling(submittedIndex);
  };

  startPolling = (index) => {
    const maxRetries = 20;
    let attempts = 0;

    const poll = async () => {
      try {
        const res = await axios.get("/api/values/current");
        const values = res.data;
        const result = values[index];

        // Check if result is a number or numeric string
        if (!isNaN(result) && isFinite(result)) {
          this.setState((prev) => ({
            values: { ...prev.values, [index]: result },
          }));
          return;
        }

        if (++attempts < maxRetries) {
          setTimeout(poll, 1000); // Retry in 1 second
        } else {
          console.warn(`Polling stopped: max retries for index ${index}`);
        }
      } catch (err) {
        console.error("Polling failed:", err);
      }
    };

    poll();
  };

  renderSeenIndexes() {
    return this.state.seenIndexes.map(({ number }) => number).join(", ");
  }

  renderValues() {
    const entries = [];

    for (let key in this.state.values) {
      entries.push(
        <div key={key}>
          For index {key} I calculated {this.state.values[key]}
        </div>
      );
    }

    return entries;
  }

  render() {
    return (
      <div>
        <form onSubmit={this.handleSubmit}>
          <label>Enter your index:</label>
          <input
            value={this.state.index}
            onChange={(event) => this.setState({ index: event.target.value })}
          />
          <button>Submit</button>
        </form>

        <h3>Indexes I have seen:</h3>
        {this.renderSeenIndexes()}

        <h3>Calculated Values:</h3>
        {this.renderValues()}
      </div>
    );
  }
}

export default Fib;
