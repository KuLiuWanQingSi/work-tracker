import { zhHans } from "vuetify/locale";

export const message = {
  $vuetify: {
    ...zhHans,
    "message.hello": "你好",
  },
  message: {
    hello: "你好",
    cannot_change_language: "切换语言失败：",
    select_datasource: "选择数据源",
    select_datasource_detail: "从URL加载或者读取一个本地目录",
    alternative_way: "也可以",
    create_new_datasource: "新建数据源",
    input_remote_url: "指向data.json或其所在目录的URL",
    input_local_directory: "包含data.json的目录",
  },
  action: {
    copy: "复制",
    close: "关闭",
  },
};
