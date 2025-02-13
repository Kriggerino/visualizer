import styles from "../styles/App.module.css";

export default function SectionSelector({ sections, onSelect, value }) {
  console.log("Sections:", sections);

  return (
    <select
      value={value}
      onChange={(e) => onSelect(e.target.value)}
      className={styles.select}
    >
      <option value="">Select Section</option>
      {sections?.map((section) => (
        <option key={section.sectionId} value={section.sectionName}>
          {section.sectionName}
        </option>
      ))}
    </select>
  );
}
