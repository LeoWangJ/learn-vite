import { render } from "https://cdn.skypack.dev/react-dom";
import React from 'https://cdn.skypack.dev/react'

let Greet = () => <h1>Hello, I'm build by ESBuild!</h1>;

render(<Greet />, document.getElementById("root"));