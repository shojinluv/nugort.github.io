package functions;

import utils.Input;

public class F__king_sh_t_login {
    // Tài khoản mẫu để thử (bài tập thôi, chưa có cơ sở dữ liệu thật)
    private static final String USERNAME = "admin";
    private static final String PASSWORD = "123456";
    private static final int MAX_TRIES = 3;

    public static void check_info() {
        for (int i = 1; i <= MAX_TRIES; i++) {
            System.out.print("Tên đăng nhập: ");
            String username = Input.readLine().trim();
            System.out.print("Mật khẩu: ");
            String password = Input.readLine();
            if (username.equals(USERNAME) && password.equals(PASSWORD)) {
                System.out.println("Chào mừng " + username + " quay lại 🎉");
                return;
            }
            int left = MAX_TRIES - i;
            if (left > 0) {
                System.out.println("Sai tên đăng nhập hoặc mật khẩu, còn " + left + " lần thử");
            }
        }
        System.out.println("Sai quá " + MAX_TRIES + " lần, tạm khoá đăng nhập 🔒");
    }
}
