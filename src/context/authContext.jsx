import axios from "axios";
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
} from "react";

const userContext = createContext();

const AuthContext = ({children}) => {
  const [user , setUser] = useState(null);
  const [loading , setLoading] = useState(true);
  
  useEffect(()=>{

    const verifyUser = async ()=>{
      try {
         const token = localStorage.getItem('token')
         if(token){
         const response = await axios.get('https://portal-backend-dun.vercel.app/api/auth/verify' , {
          headers:{
            "Authorization": `Bearer ${token}`
          }
         })
         if(response.data.success){
            setUser(response.data.user)    
         }
        }else{
          setUser(null);
          setLoading(false)
         }
        
      }
      
      catch (error) {
        // Token invalid or expired - clear user and remove token
        console.error("Auth verify failed:", error.response?.data?.error || error.message);
        setUser(null);
        localStorage.removeItem("token");
      }finally{
          setLoading(false)
      }
    };
    verifyUser();
  },[])

  const login = (user) =>{
     setUser(user)
  }
  const logout = () =>{
     setUser(null)
     localStorage.removeItem("token")
  }
  return (
    <userContext.Provider value={{user , login , logout , loading , }}>
      {children}
    </userContext.Provider>
  )
}

export const useAuth = () => useContext(userContext);
export default AuthContext;
