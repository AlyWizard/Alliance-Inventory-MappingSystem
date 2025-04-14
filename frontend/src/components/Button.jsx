import styles from './Button.module.css';

function Button({ text, onClick, size = 'normal' }) {
  const buttonClass = size === 'large' 
    ? `${styles.button} ${styles.buttonLarge}` 
    : styles.button;
    
  return (
    <button onClick={onClick} className={buttonClass}>
      {text}
    </button>
  );
}

export default Button;