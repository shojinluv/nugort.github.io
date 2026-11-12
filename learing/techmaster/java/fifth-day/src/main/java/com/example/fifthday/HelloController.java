package com.example.fifthday;

import javafx.event.ActionEvent;
import javafx.fxml.FXML;
import javafx.scene.control.Label;
import javafx.scene.control.PasswordField;
import javafx.scene.control.TextField;

public class HelloController {
    // Tài khoản mẫu để thử (bài tập thôi, chưa có cơ sở dữ liệu thật)
    private static final String DEMO_USERNAME = "admin";
    private static final String DEMO_PASSWORD = "123456";

    @FXML
    private TextField text_field_username;
    @FXML
    private PasswordField text_field_password; // PasswordField: gõ mật khẩu hiện dấu chấm, không lộ chữ
    @FXML
    private Label label_login_status;

    @FXML
    public void onSignInClick(ActionEvent actionEvent) {
        String username = text_field_username.getText().trim();
        String password = text_field_password.getText();
        if (username.isEmpty() || password.isEmpty()) {
            showStatus("Hãy nhập tên đăng nhập và mật khẩu");
        } else if (username.equals(DEMO_USERNAME) && password.equals(DEMO_PASSWORD)) {
            showStatus("Chào mừng " + username + " quay lại 🌟");
        } else {
            showStatus("Sai tên đăng nhập hoặc mật khẩu");
        }
    }

    @FXML
    public void onSignUpClick(ActionEvent actionEvent) {
        showStatus("Tính năng đăng ký sắp có 🚧");
    }

    @FXML
    public void onForgotPasswordClick(ActionEvent actionEvent) {
        showStatus("Gợi ý: thử admin / 123456 😉");
    }

    // Dòng trạng thái dưới hai nút: vốn ẩn sẵn trong FXML (visible="false"), có tin nhắn thì mới hiện
    private void showStatus(String message) {
        label_login_status.setText(message);
        label_login_status.setVisible(true);
    }
}
