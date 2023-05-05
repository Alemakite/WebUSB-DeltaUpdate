//Notification component to be displayed in Table
const Notif = ({ notif }) => {
  let color;
  switch (notif.type) {
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
      {notif.message}
    </div>
  );
};
export default Notif;
