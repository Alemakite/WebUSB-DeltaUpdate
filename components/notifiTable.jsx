import Notif from "./notif";

const Table = ({ notifs }) => {
  if (notifs.length < 1) return;

  return (
    //displaying notifs passed as the argument
    <div style={styles.container}>
      {notifs.map((element, i) => {
        return <Notif key={`notifs-${i}`} notif={element} />;
      })}
    </div>
  );
};

//styles for the Table component
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
