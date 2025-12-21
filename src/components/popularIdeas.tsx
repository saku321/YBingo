import '../styles/popular.css';

import Marquee from 'react-fast-marquee';

export default function PopularIdeas() {
  const ideas = ["BTC to 200k", "ETH to 10k", "Ukraine war ends"];

  // Duplicate ideas for seamless loop
  const scrollingIdeas = [...ideas, ...ideas];

  return (
    <>
        <div className="ideaContainer">
            <h2 id="smallTitle">Who knows:</h2>
          <Marquee  className=" border-t rounded-2xl border-b py-3 overflow-hidden grid  ">
            <div className=" flex pr-10 flex-col justify-center items-center h-[350px] mx-5 ">
              <li className="idea" ><span>BTC to 200k</span></li>
            </div>

            <div className=" flex pr-10 flex-col justify-center items-center h-[350px] mx-5 ">
                  <li className="idea"><span>ETH to 10k</span></li>
            </div>

            <div className=" flex pr-10 flex-col justify-center items-center h-[350px] mx-5 ">
                 <li className="idea"><span>Ukraine War ends</span></li>
            </div>

          
          </Marquee>
        </div>
    </>
  


  );
}
