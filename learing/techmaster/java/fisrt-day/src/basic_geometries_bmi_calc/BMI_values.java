package basic_geometries_bmi_calc;

public class BMI_values {
    public static double BMI_value_double(double weight, double height) {
        return weight / (height * height);
    }

    // Xếp loại theo bảng BMI của WHO. Các mốc nối liền nhau (dưới 25, dưới 30...),
    // để không còn khe hở như 24.95 lọt xuống loại béo phì nặng
    public static String classify(double bmi) {
        if (bmi < 18.5) {
            return "Gầy";
        } else if (bmi < 25) {
            return "Bình thường";
        } else if (bmi < 30) {
            return "Thừa cân";
        } else if (bmi < 35) {
            return "Béo phì";
        }
        return "Béo phì nặng";
    }
}
