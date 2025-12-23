import '../styles/popular.css';
import Paper from '@mui/material/Paper';
import { styled } from '@mui/material/styles';
import Marquee from 'react-fast-marquee';


const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  color: (theme.vars ?? theme).palette.text.secondary,
  ...theme.applyStyles('dark', {
    backgroundColor: '#1A2027',
  }),
}));

export default function PopularIdeas() {

  return (
    <>
        <div className="ideaContainer">
            <h2 id="smallTitle">Popular ideas</h2>
          <Marquee  className=" border-t rounded-2xl border-b py-3 overflow-hidden grid  ">
            

         
            <div className=" flex pr-10 flex-col justify-center items-center h-[350px] mx-5 ">
              <Item className="idea" ><span>BTC to 200k</span></Item>
            </div>

            <div className=" flex pr-10 flex-col justify-center items-center h-[350px] mx-5 ">
                  <Item className="idea"><span>ETH to 10k</span></Item>
            </div>

            <div className=" flex pr-10 flex-col justify-center items-center h-[350px] mx-5 ">
                 <Item className="idea"><span>Sol to 500$</span></Item>
            </div>

          
          </Marquee>
        </div>
    </>
  


  );
}
