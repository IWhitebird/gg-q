import { useEffect, useState } from "react";
import { IQuiz } from "../types";
import axios from "axios";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { RootState } from "../reducer";
import { AiOutlineClose} from "react-icons/ai";

const PlayQuiz = () => {
  const [quiz, setQuiz] = useState<IQuiz>();
  const [time, setTime] = useState<string>("00:00:00");
  const [answers, setAnswers] = useState<any>();
  const char = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any>();

  const user = useSelector((state: RootState) => state.user.user);


  const localquiz = localStorage.getItem("cur_quiz");
  const timeValue = new Date(JSON.parse(localquiz!).time);
  const timeRemaining = timeValue.getTime() - Date.now();


  useEffect(() => {
    fetchCompleteQuiz();
    if (timeRemaining > 0) {
      setTime(millisecondsToTime(timeRemaining));
    }
  }, []);

  function millisecondsToTime(ms: number) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);

    const formattedTime = `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

    return formattedTime;
  }

  async function submitHandle() {
    try{
      setLoading(true);
      console.log(answers)
      if(answers === undefined) {
        window.location.href = '/home';
      }
      const token = localStorage.getItem("token");
      const quizId = JSON.parse(localquiz!).quizId;
      const response = await axios.post(
        import.meta.env.VITE_API_URL + `/quiz/submitQuiz/${quizId}`,
        {
          answers: answers,
          timeRemaining : timeRemaining
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(response.data);

      if (response.statusText === "OK") {
        toast.success("Quiz Submitted Successfully!!");
      }

      setResult(response.data)
      setLoading(false);
    }
    catch(error){
      console.error(error);
    }
  }

  async function timeOverHandle() {
    toast("Time Over!!", { icon: "⏰" });
    setTimeout(() => {
      submitHandle();
    }, 1000)
  }

  useEffect(() => {
    const countdownInterval = setInterval(() => {
      const [hours, minutes, seconds] = time.split(":").map(Number);

      if (hours === 0 && minutes === 0 && seconds === 0) {
        clearInterval(countdownInterval);
        timeOverHandle(); 
      } else {
        let newHours = hours;
        let newMinutes = minutes;
        let newSeconds = seconds;

        if (seconds <= 0) {
          if (minutes <= 0) {
            if (hours <= 0) {
              setTime("00:00:00");
              clearInterval(countdownInterval);
              timeOverHandle();
              return;
            } else {
              newHours -= 1;
            }
            newMinutes = 59;
          } else {
            newMinutes -= 1;
          }
          newSeconds = 59;
        } else {
          newSeconds -= 1;
        }

        const newTime = `${newHours.toString().padStart(2, "0")}:${newMinutes
          .toString()
          .padStart(2, "0")}:${newSeconds.toString().padStart(2, "0")}`;
        setTime(newTime);
      }
    }, 1000);

    return () => {
      clearInterval(countdownInterval);
    };
  }, [time, timeOverHandle]);

  async function fetchCompleteQuiz() {
    try {
      const token = localStorage.getItem("token");
      if (!localquiz) return;

      const quizId = JSON.parse(localquiz).quizId;

      const response = await axios.get(
        import.meta.env.VITE_API_URL + `/quiz/getCompleteQuiz/${quizId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setQuiz(response.data.quiz);
      console.log(response.data);
    } catch (error) {
      console.error(error);
    }
  }

  const changeHandle = (e: any, quid: any) => {
    let newAns = {
      ...answers,
      [quid]: e.target.value,
    };

    setAnswers(newAns);
  };

  return (
    <>
      <div>
        <div className="absolute w-full ">
          <div
            className=" w-[80%] text-3xl items-center bg-black mx-auto 
            h-[50px] mt-5 rounded-[15px] text-white flex justify-between p-8"
          >
            <div className="flex flex-row items-center gap-2 h-full">
              <h1 className="">Quiz Name :</h1>
              <h1 className="font-bold">{quiz?.name}</h1>
            </div>

            <div className="items-center lg:mr-[8rem]">
              <h1 className="">Good Luck!!!</h1>
            </div>

            <div className="hover:scale-125 hover:text-cyan-500 transition-all ease-in-out duration-300">
              <h1>{time}</h1>
            </div>
          </div>
        </div>

        <div className="mt-[10rem] w-[80%] mx-auto h-full flex flex-col">
          {quiz?.assignment.map((ass, index) => {
            return (
              <div key={index} className="w-full h-full mb-10">
                <div className="text-5xl flex flex-row justify-between w-[90%] mx-auto">
                  <div className="font-bold">
                    Assignment {index + 1} : {ass.name}
                  </div>
                  <div className="text-4xl mt-2">Total Points : {ass.maxscore}</div>
                </div>

                <div className="indent-8 mt-6 text-lg">{ass.description}</div>

                <div className="w-full h-full flex flex-col text-2xl mt-4 ">
                  <p className="font-bold">Instructions </p>
                  <ul>
                    {ass.instructions?.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="mt-5 max-w-full h-full flex flex-col">
                  {ass.questions?.map((que, i) => (
                    <div
                      key={i}
                      className="text-3xl font-bold mt-5 border-[2px] p-4 rounded-md border-black h-auto"
                    >
                      <div className="w-full h-auto flex flex-col">
                        <div className="flex flex-row justify-between mb-5 mt-2">
                          <div className="w-[90%]">
                            Q.{i + 1} {que.question}
                          </div>

                          <div>{que.points}</div>
                        </div>

                        <div className="flex flex-col w-70% gap-y-5 ml-5 mb-5 mt-5">
                          {que.options?.map((opt: any, i: number) => (
                            <div
                              key={i}
                              className={`text-2xl flex items-center border-2 rounded-md border-black p-2 transition-all duration-300 ease-in-out 
                            ${
                              answers !== undefined && answers[que._id] === opt
                                ? "bg-slate-400"
                                : ""
                            }`}
                            >
                              <input
                                type="radio"
                                name={que._id}
                                id={`${que._id}_${i}`}
                                value={opt}
                                onChange={(e) => changeHandle(e, que._id)}
                                className="hidden"
                              />
                              <label
                                htmlFor={`${que._id}_${i}`}
                                className="w-full h-full cursor-pointer"
                              >
                                <i className="w-full text-lg font-semibold">
                                  {char[i]}. {opt}
                                </i>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div className="w-[80%] mx-auto mt-10 mb-10 flex justify-center">
          <button onClick={submitHandle} className="w-[160px] h-[50px] bg-black text-white text-2xl rounded-md border-2 border-white hover:bg-white hover:border-black hover:text-black hover:scale-125 transition-all duration-300 ease-in-out">Submit</button>
        </div>
      </div>

      {
        true && (
          <div  className="w-screen h-screen backdrop-blur-sm fixed">
            <div className="w-full h-full flex justify-center items-center content-center">
              <div className="w-[60%] h-[60%] bg-white flex flex-col border-2 rounded-lg border-black" >
                <div className="flex flex-row justify-between">
                  <div>

                  </div>
                  <div className="text-center lg:text-5xl mt-5 ml-24 font-bold">
                    Results !! 📝
                  </div>
                  <div className="m-5 lg:text-3xl cursor-pointer">
                    <AiOutlineClose />
                  </div>
                </div>
                <hr />
                <div className="lg:text-3xl font-bold lg:mt-10 text-center">
                  Total Score is : <br /> <span className="lg:text-4xl">{result?.score}</span>
                </div>
                <div className="lg:text-3xl font-bold lg:mt-10 text-center">
                  You got {result?.correct} correct answers
                </div>
                <div className="w-full mx-auto mt-20 flex flex-row  justify-center gap-9">
                  <button className="w-[160px] h-[50px] bg-black text-white text-2xl 
                  rounded-md border-2 border-white hover:bg-white hover:border-black
                   hover:text-black hover:scale-125 transition-all duration-300 ease-in-out">
                    Retry
                  </button>
                  <button className="w-[160px] h-[50px] bg-black text-white text-2xl rounded-md border-2
                   border-white hover:bg-white hover:border-black hover:text-black 
                   hover:scale-125 transition-all duration-300 ease-in-out">
                      Go Home
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </>
  );
};

export default PlayQuiz;
