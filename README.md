# React Managed Draggable

*Fully controlled React component with simple dragging interface*

Allows you to drag elements rendered by React components.
Mouse and touch dragging are both supported.

## Installation

**Node.JS**

```shell
npm install --save react-managed-draggable
```

**Browser**

```html
<script src="//unpkg.com/react-managed-draggable@latest/lib/browser/bundle.js"></script>
<!-- or: -->
<script src="//unpkg.com/react-managed-draggable@latest/lib/browser/bundle.min.js"></script>
```

## Example usage

[Example on CodePen.io](https://codepen.io/woutervh/pen/QWLVmjY)

```jsx
class App extends React.PureComponent {
  state = {
    deltaX: 0,
    deltaY: 0
  };

  render() {
    return (
      <ReactManagedDraggable.Draggable
        style={{ position: "relative", cursor: "pointer" }}
        onDragStart={this.handleDragStart}
        onDragMove={this.handleDragMove}
        onDragEnd={this.handleDragEnd}
      >
        <div
          style={{
            position: "absolute",
            top: this.state.deltaY,
            left: this.state.deltaX
          }}
        >
          Hello world
        </div>
      </ReactManagedDraggable.Draggable>
    );
  }

  handleDragStart = (event, dragInformation) => {
    // No-op.
  };

  handleDragMove = (event, dragInformation) => {
    this.setState({
      deltaX: dragInformation.current.x - dragInformation.start.x,
      deltaY: dragInformation.current.y - dragInformation.start.y
    });
  };

  handleDragEnd = (event, dragInformation) => {
    this.setState({ deltaX: 0, deltaY: 0 });
  };
}

ReactDOM.render(<App />, document.getElementById("container"));
```
