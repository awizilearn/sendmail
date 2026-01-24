export type SmtpConfig = {
    host: string;
    port: number;
    user: string;
    pass: string;
    secure: boolean;
    savePassword?: boolean;
};
