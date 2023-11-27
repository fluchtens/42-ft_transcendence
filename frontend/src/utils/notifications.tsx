import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const notifySuccess = (message: string) => {
  const formatedMessage = Array.isArray(message) ? message[0] : message;

  toast.success(formatedMessage, {
    position: "top-center",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: false,
    pauseOnHover: false,
    pauseOnFocusLoss: false,
    draggable: true,
    progress: undefined,
    theme: "colored",
  });
};

export const notifyError = (message: string) => {
  const formatedMessage = Array.isArray(message) ? message[0] : message;

  toast.error(formatedMessage, {
    position: "top-center",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: false,
    pauseOnHover: false,
    pauseOnFocusLoss: false,
    draggable: true,
    progress: undefined,
    theme: "colored",
  });
};

export const Notify = () => <ToastContainer />;
