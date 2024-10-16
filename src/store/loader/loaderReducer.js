import { LOADING_SHOW, LOADING_HIDE} from "./loaderTypes";

const initialState = {
  loading: false,
};

const loaderReducer = function (state = initialState, action) {
  const { type, payload } = action;
  switch (type) {
    case LOADING_SHOW:
      return {
        ...state,
        loading: true,
      };
    case LOADING_HIDE: {
      return {
        ...state,
        loading: false
      };
    }
    default:
      return state;
  }
}

export default loaderReducer;