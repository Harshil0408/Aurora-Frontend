import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import authReducer from "@/store/authSlice";
import rbacReducer from "@/store/rbacSlice";
import sellerAuthReducer from "@/store/sellerAuthSlice";
import sellerStoreReducer from "@/store/sellerStoreSlice";
import { api } from "@/services/api";

export const makeStore = () => {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      rbac: rbacReducer,
      sellerAuth: sellerAuthReducer,
      sellerStore: sellerStoreReducer,
      [api.reducerPath]: api.reducer,
    },
    middleware: (getDefault) => getDefault().concat(api.middleware),
    devTools: process.env.NODE_ENV !== "production",
  });
  // Enables refetchOnFocus / refetchOnReconnect for permission polling.
  setupListeners(store.dispatch);
  return store;
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
