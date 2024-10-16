import { LOADING_SHOW, LOADING_HIDE} from "./loaderTypes";

//Login User
export const loadingShow = (loading) => async (dispatch) => {
  if(loading){
    dispatch({
      type: LOADING_SHOW,
    });
  }else{
    dispatch({
      type: LOADING_HIDE,
    });
  }
 
};