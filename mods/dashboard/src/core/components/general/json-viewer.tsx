import {
  JsonView,
  allExpanded,
  darkStyles,
  defaultStyles
} from "react-json-view-lite";
import "react-json-view-lite/dist/index.css";

export const JsonViewer = ({
  data,
  expanded = allExpanded,
  styles = defaultStyles
}: {
  data: Object | Array<any>;
  expanded?: () => boolean;
  styles?: typeof defaultStyles | typeof darkStyles;
}) => {
  return <JsonView data={data} shouldExpandNode={expanded} style={styles} />;
};
