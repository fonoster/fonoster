/*
 * Copyright (C) 2025 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonoster
 *
 * This file is part of Fonoster
 *
 * Licensed under the MIT License (the "License");
 * you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 *    https://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import Add from "@mui/icons-material/AddOutlined";
import DarkMode from "@mui/icons-material/DarkModeOutlined";
import LightMode from "@mui/icons-material/LightModeOutlined";
import Settings from "@mui/icons-material/SettingsOutlined";
import Person from "@mui/icons-material/PersonOutline";
import Groups from "@mui/icons-material/GroupsOutlined";
import Close from "@mui/icons-material/CloseOutlined";
import NotificationsActive from "@mui/icons-material/NotificationsActiveOutlined";
import CheckboxEmpty from "@mui/icons-material/CheckBoxOutlineBlankOutlined";
import CheckboxSelected from "@mui/icons-material/CheckBoxOutlined";
import CheckboxIntermediate from "@mui/icons-material/IndeterminateCheckBoxOutlined";
import MinusOutline from "@mui/icons-material/RemoveOutlined";
import UnfoldLess from "@mui/icons-material/UnfoldLessOutlined";
import UnfoldMore from "@mui/icons-material/UnfoldMoreOutlined";
import ArrowDropUp from "@mui/icons-material/ArrowDropUpOutlined";
import ArrowDropDown from "@mui/icons-material/ArrowDropDownOutlined";
import Search from "@mui/icons-material/SearchOutlined";
import Calendar from "@mui/icons-material/CalendarTodayOutlined";
import OpenInNew from "@mui/icons-material/OpenInNewOutlined";
import Key from "@mui/icons-material/VpnKeyOutlined";
import Delete from "@mui/icons-material/DeleteOutlined";
import Email from "@mui/icons-material/EmailOutlined";
import Edit from "@mui/icons-material/EditOutlined";
import Upload from "@mui/icons-material/FileUploadOutlined";
import Show from "@mui/icons-material/VisibilityOutlined";
import Info from "@mui/icons-material/InfoOutlined";
import Copy from "@mui/icons-material/ContentCopyOutlined";
import Minus from "@mui/icons-material/RemoveOutlined";
import Chat from "@mui/icons-material/QuestionAnswerOutlined";
import Phone from "@mui/icons-material/PhoneEnabledOutlined";
import CameraOn from "@mui/icons-material/VideocamOutlined";
import CameraOff from "@mui/icons-material/VideocamOffOutlined";
import MicOff from "@mui/icons-material/MicOffOutlined";
import MicOn from "@mui/icons-material/MicNoneOutlined";
import PictureInPicture from "@mui/icons-material/PictureInPictureOutlined";
import ScreenShareOn from "@mui/icons-material/ScreenShareOutlined";
import ScreenShareOff from "@mui/icons-material/StopScreenShareOutlined";
import KeyboardArrowUp from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDown from "@mui/icons-material/KeyboardArrowDown";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { type SvgIconProps } from "@mui/material";

type IconName =
  | "Add"
  | "DarkMode"
  | "LightMode"
  | "Settings"
  | "Person"
  | "Groups"
  | "Close"
  | "NotificationsActive"
  | "CheckboxEmpty"
  | "CheckboxSelected"
  | "CheckboxIntermediate"
  | "MinusOutline"
  | "UnfoldLess"
  | "KeyboardArrowDownIcon"
  | "KeyboardArrowUpIcon"
  | "UnfoldMore"
  | "KeyboardArrowUp"
  | "KeyboardArrowDown"
  | "ArrowDropUp"
  | "ArrowDropDown"
  | "Search"
  | "Calendar"
  | "OpenInNew"
  | "Key"
  | "Delete"
  | "Email"
  | "Edit"
  | "Upload"
  | "Show"
  | "Info"
  | "Copy"
  | "Minus"
  | "Chat"
  | "Phone"
  | "CameraOn"
  | "CameraOff"
  | "MicOff"
  | "MicOn"
  | "PictureInPicture"
  | "ScreenShareOn"
  | "ScreenShareOff"
  | "ChevronLeft"
  | "ChevronRight";

type IconProps = SvgIconProps & {
  name: IconName;
  fontSize?: "small" | "medium" | "large" | "inherit";
};

export function Icon(props: IconProps) {
  const { name, fontSize } = props;
  const actualFontSize = fontSize || "medium";

  switch (name) {
    case "Add":
      return <Add {...props} fontSize={actualFontSize} />;
    case "DarkMode":
      return <DarkMode {...props} fontSize={actualFontSize} />;
    case "LightMode":
      return <LightMode {...props} fontSize={actualFontSize} />;
    case "Settings":
      return <Settings {...props} fontSize={actualFontSize} />;
    case "Person":
      return <Person {...props} fontSize={actualFontSize} />;
    case "Groups":
      return <Groups {...props} fontSize={actualFontSize} />;
    case "Close":
      return <Close {...props} fontSize={actualFontSize} />;
    case "NotificationsActive":
      return <NotificationsActive {...props} fontSize={actualFontSize} />;
    case "CheckboxEmpty":
      return <CheckboxEmpty {...props} fontSize={actualFontSize} />;
    case "CheckboxSelected":
      return <CheckboxSelected {...props} fontSize={actualFontSize} />;
    case "CheckboxIntermediate":
      return <CheckboxIntermediate {...props} fontSize={actualFontSize} />;
    case "MinusOutline":
      return <MinusOutline {...props} fontSize={actualFontSize} />;
    case "UnfoldLess":
      return <UnfoldLess {...props} fontSize={actualFontSize} />;
    case "UnfoldMore":
      return <UnfoldMore {...props} fontSize={actualFontSize} />;
    case "KeyboardArrowUp":
      return <KeyboardArrowUp {...props} fontSize={actualFontSize} />;
    case "KeyboardArrowDown":
      return <KeyboardArrowDown {...props} fontSize={actualFontSize} />;
    case "KeyboardArrowDownIcon":
      return <KeyboardArrowDownIcon {...props} fontSize={actualFontSize} />;
    case "KeyboardArrowUpIcon":
      return <KeyboardArrowUpIcon {...props} fontSize={actualFontSize} />;
    case "ArrowDropUp":
      return <ArrowDropUp {...props} fontSize={actualFontSize} />;
    case "ArrowDropDown":
      return <ArrowDropDown {...props} fontSize={actualFontSize} />;
    case "Search":
      return <Search {...props} fontSize={actualFontSize} />;
    case "Calendar":
      return <Calendar {...props} fontSize={actualFontSize} />;
    case "OpenInNew":
      return <OpenInNew {...props} fontSize={actualFontSize} />;
    case "Key":
      return <Key {...props} fontSize={actualFontSize} />;
    case "Delete":
      return <Delete {...props} fontSize={actualFontSize} />;
    case "Email":
      return <Email {...props} fontSize={actualFontSize} />;
    case "Edit":
      return <Edit {...props} fontSize={actualFontSize} />;
    case "Upload":
      return <Upload {...props} fontSize={actualFontSize} />;
    case "Show":
      return <Show {...props} fontSize={actualFontSize} />;
    case "Info":
      return <Info {...props} fontSize={actualFontSize} />;
    case "Copy":
      return <Copy {...props} fontSize={actualFontSize} />;
    case "Minus":
      return <Minus {...props} fontSize={actualFontSize} />;
    case "Chat":
      return <Chat {...props} fontSize={actualFontSize} />;
    case "Phone":
      return <Phone {...props} fontSize={actualFontSize} />;
    case "CameraOn":
      return <CameraOn {...props} fontSize={actualFontSize} />;
    case "CameraOff":
      return <CameraOff {...props} fontSize={actualFontSize} />;
    case "MicOff":
      return <MicOff {...props} fontSize={actualFontSize} />;
    case "MicOn":
      return <MicOn {...props} fontSize={actualFontSize} />;
    case "PictureInPicture":
      return <PictureInPicture {...props} fontSize={actualFontSize} />;
    case "ScreenShareOn":
      return <ScreenShareOn {...props} fontSize={actualFontSize} />;
    case "ScreenShareOff":
      return <ScreenShareOff {...props} fontSize={actualFontSize} />;
    case "ChevronLeft":
      return <ChevronLeft {...props} fontSize={actualFontSize} />;
    case "ChevronRight":
      return <ChevronRight {...props} fontSize={actualFontSize} />;
    default:
      return null;
  }
}
