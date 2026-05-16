import { message, notification } from "antd";

export const NotifToast = ({ type = "info", message: msg = "" }) => {
  switch (type) {
    case "success":
      return message.success(msg);
    case "error":
      return message.error(msg);
    case "warning":
      return message.warning(msg);
    default:
      return message.info(msg);
  }
};

export const NotifAlert = ({
  icon = "info",
  title = "Informasi",
  message: desc = "",
  placement = "topRight",
}) => {
  switch (icon) {
    case "success":
      return notification.success({
        message: title,
        description: desc,
        placement,
      });
    case "error":
      return notification.error({
        message: title,
        description: desc,
        placement,
      });
    case "warning":
      return notification.warning({
        message: title,
        description: desc,
        placement,
      });
    default:
      return notification.info({
        message: title,
        description: desc,
        placement,
      });
  }
};
