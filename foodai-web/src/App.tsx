import { useEffect, useState } from "react";

function App() {

  const [message, setMessage] = useState("로딩중...");

  useEffect(() => {

    fetch("http://localhost:5260/api/meals")
      .then(res => res.json())
      .then(data => {
        console.log(data);

        setMessage(data.message);
      })
      .catch(error => {
        console.error(error);

        setMessage("API 연결 실패");
      });

  }, []);

  return (
    <div
      style={{
        padding: "50px",
        fontSize: "40px",
        color: "white",
        backgroundColor: "black",
        minHeight: "100vh"
      }}
    >
      {message}
    </div>
  );
}

export default App;