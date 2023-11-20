import styles from "./Modal.module.scss";

interface ModalProps {
  children: React.ReactNode;
}

const Modal = ({ children }: ModalProps) => (
  <div className={styles.modal}>{children}</div>
);

export { Modal };
