package basic_calc;

public class convert_temperature {
    public static double c_to_f(double c_temperature) {
        return c_temperature * 1.8 + 32;
    }

    public static double f_to_c(double f_temperature) {
        return (f_temperature - 32) / 1.8;
    }
}
