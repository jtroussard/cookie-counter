import "./Loading.css";
import CookieImage from "/public/Cookie.png"; // Adjust path as needed

const Loading = () => {
  return (
    <div className=" loading-container">
      <img src={CookieImage} alt="Loading..." className="rolling-cookie" />
      <h3>Loading...</h3>
    </div>
  );
};

export default Loading;
