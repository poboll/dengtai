import type { ChangeEvent } from "react";
import { SearchIcon } from "@/components/icons/Icon";
import styles from "./SearchBar.module.css";

type SearchBarProps = {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  buttonLabel?: string;
};

const SearchBar = ({ placeholder, value, onChange, onSubmit, buttonLabel = "搜索" }: SearchBarProps) => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <div className={styles.wrapper}>
      <SearchIcon width={20} height={20} strokeWidth={1.8} />
      <input
        className={styles.input}
        value={value}
        placeholder={placeholder}
        onChange={handleChange}
      />
      <button className={styles.button} type="button" onClick={onSubmit}>
        {buttonLabel}
      </button>
    </div>
  );
};

export default SearchBar;
