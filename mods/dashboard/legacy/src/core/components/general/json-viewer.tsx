import { JsonView, allExpanded } from "react-json-view-lite";
import "react-json-view-lite/dist/index.css";
import { styled } from "@mui/material/styles";

const JsonViewerContainer = styled("div")(({ theme }) => ({
  fontFamily: "'Poppins', sans-serif",
  fontSize: "12px",
  lineHeight: "1.5",
  backgroundColor: theme.palette.base["01"],
  border: `1px solid ${theme.palette.base["03"]}`,
  borderRadius: "4px",
  padding: "16px",
  overflow: "auto",
  maxHeight: "60dvh",
  minHeight: "200px",

  "& .fonoster-json-container": {
    fontFamily: "'Poppins', sans-serif !important",
    fontSize: "12px !important",
    lineHeight: "1.5 !important",
    color: `${theme.palette.base["07"]} !important`,
    backgroundColor: `${theme.palette.base["01"]} !important`
  },

  // Labels
  "& .fonoster-json-label": {
    color: `${theme.palette.brand["03"]} !important`,
    fontWeight: "500 !important"
  },

  "& .fonoster-json-clickable-label": {
    color: `${theme.palette.brand["03"]} !important`,
    fontWeight: "500 !important",
    cursor: "pointer !important",
    "&:hover": {
      color: `${theme.palette.brand.main} !important`
    }
  },

  "& .fonoster-json-string": {
    color: `${theme.palette.brand.main} !important`
  },

  "& .fonoster-json-number": {
    color: `${theme.palette.brand["04"]} !important`,
    fontWeight: "500 !important"
  },

  "& .fonoster-json-boolean": {
    color: `${theme.palette.brand["02"]} !important`,
    fontWeight: "500 !important"
  },

  "& .fonoster-json-null, & .fonoster-json-undefined": {
    color: `${theme.palette.base["04"]} !important`,
    fontStyle: "italic !important"
  },

  "& .fonoster-json-other": {
    color: `${theme.palette.base["06"]} !important`
  },

  "& .fonoster-json-punctuation": {
    color: `${theme.palette.base["04"]} !important`,
    fontWeight: "400 !important"
  },

  "& .fonoster-json-expand, & .fonoster-json-collapse": {
    color: `${theme.palette.brand.main} !important`,
    cursor: "pointer !important",
    display: "inline-flex !important",
    alignItems: "center !important",
    justifyContent: "center !important",
    width: "12px !important",
    height: "12px !important",
    marginRight: "6px !important",
    fontSize: "10px !important",
    "&:hover": {
      color: `${theme.palette.brand["04"]} !important`
    }
  },

  "& .fonoster-json-collapsed": {
    color: `${theme.palette.base["05"]} !important`,
    fontStyle: "italic !important"
  },

  "& .fonoster-json-children": {
    marginLeft: "16px !important",
    paddingLeft: "4px !important"
  },

  "& .fonoster-json-child": {
    margin: "1px 0 !important",
    padding: "1px 2px !important",
    borderRadius: "2px !important",
    "&:hover": {
      backgroundColor: `${theme.palette.base["02"]} !important`,
      borderRadius: "2px !important"
    }
  },

  "& .fonoster-json-container .rjl-tree-node": {
    position: "relative !important",
    "&::before": {
      content: '""',
      position: "absolute !important",
      left: "-8px !important",
      top: "0 !important",
      bottom: "0 !important",
      width: "1px !important",
      backgroundColor: `${theme.palette.base["03"]} !important`,
      opacity: "0.2 !important"
    },
    "& + .rjl-tree-node": {
      marginTop: "2px !important"
    }
  }
}));

export const JsonViewer = ({
  data = {},
  expanded = allExpanded
}: {
  data: Object | Array<any>;
  expanded?: () => boolean;
}) => {
  const fonosterDarkStyles = {
    container: "fonoster-json-container",
    basicChildStyle: "fonoster-json-child",
    label: "fonoster-json-label",
    clickableLabel: "fonoster-json-clickable-label",
    nullValue: "fonoster-json-null",
    undefinedValue: "fonoster-json-undefined",
    numberValue: "fonoster-json-number",
    stringValue: "fonoster-json-string",
    booleanValue: "fonoster-json-boolean",
    otherValue: "fonoster-json-other",
    punctuation: "fonoster-json-punctuation",
    expandIcon: "fonoster-json-expand",
    collapseIcon: "fonoster-json-collapse",
    collapsedContent: "fonoster-json-collapsed",
    childFieldsContainer: "fonoster-json-children",
    noQuotesForStringValues: false,
    quotesForFieldNames: true,
    ariaLables: {
      collapseJson: "Collapse JSON",
      expandJson: "Expand JSON"
    },
    stringifyStringValues: false
  };

  return (
    <JsonViewerContainer>
      <JsonView
        data={data}
        shouldExpandNode={expanded}
        style={fonosterDarkStyles}
      />
    </JsonViewerContainer>
  );
};
