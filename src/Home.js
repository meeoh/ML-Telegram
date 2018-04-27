import React from "react";
import "./Home.css";
import "semantic-ui-css/semantic.min.css";

import { Form, Input } from "semantic-ui-react";
import axios from "axios";

class Home extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            response: [],
            query: "",
            error: ""
        };
        this.onSubmit = this.onSubmit.bind(this);
    }

    onSubmit() {
        console.log(this.state.query);
        axios
            .post("/lookup", { query: this.state.query })
            .then(response => {
                console.log(response);
                if (response.status == 200) {
                    var people = response.data.response;
                    var sortable = [];
                    for (var person in people) {
                        sortable.push([person, people[person]]);
                    }
                    var final = sortable.sort((a, b) => b[1] - a[1]);
                    console.log(final);
                    this.setState({ response: final, error: "" });
                } else {
                    this.setState({ error: response.data.response });
                }
            })
            .catch(response => {
                console.log(response);
            });
    }

    render() {
        return (
            <div className="Home">
                <div className="content">
                    <Form onSubmit={this.onSubmit}>
                        <Form.Field>
                            <Input
                                onChange={(e, { value }) =>
                                    this.setState({ query: value })
                                }
                                placeholder="Search..."
                            />
                        </Form.Field>
                    </Form>
                    {this.state.response.length > 0
                        ? this.state.response.map(person => {
                              return (
                                  <h4>
                                      {person[0]} has a {person[1] * 100}%
                                      likelyhood
                                  </h4>
                              );
                          })
                        : null}
                    <h4>{this.state.error}</h4>
                </div>
            </div>
        );
    }
}

export default Home;
