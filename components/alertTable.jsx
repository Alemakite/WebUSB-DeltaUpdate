const Table = ({ notifs }) => {
  if (notifs.length < 1) return;
  return (
    //displaying notifs passed as the argument
    <div style={styles.container}>
      {notifs.map((element, i) => {
        return <Alert key={`notifs-${i}`} notify={element} />;
      })}
    </div>
  );
};

//Alert component to be displayed in Table
const Alert = ({ notify }) => {
  let color = "";
  switch (notify.type) {
    case "Info":
      color = "lightblue";
      break;
    case "Transfer":
      color = "green";
      break;
    case "Error":
      color = "red";
      break;
  }
  return (
    <div
      style={{
        fontWeight: "bold",
        color: color,
        outline: "solid thin",
        outlineColor: "black",
        padding: "10px",
      }}
    >
      {notify.message}
    </div>
  );
};

//styles for table object
const styles = {
  container: {
    display: "flex",
    flex: 1,
    flexDirection: "column",
    backgroundColor: "grey",
    overflowY: "scroll",
    height: "200px",
    color: "white",
    outline: "2px solid black",
  },
};
export default Table;
