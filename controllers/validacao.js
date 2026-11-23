export class ErroHttp extends Error {
    constructor(status, mensagem) {
        super(mensagem);
        this.status = status;
    }
}

export function cpf(valor) {
    if (typeof valor !== 'string' || !/^\d{11}$/.test(valor)) {
        throw new ErroHttp(400, 'Informe o CPF como texto com 11 dígitos.');
    }

    return valor;
}

export function inteiro(valor, campo, maximo = 4294967295) {
    const numero = Number(valor);

    if (!['string', 'number'].includes(typeof valor) ||
        !/^\d+$/.test(String(valor)) || !Number.isSafeInteger(numero) ||
        numero < 1 || numero > maximo) {
        throw new ErroHttp(400, `${campo} deve ser um inteiro entre 1 e ${maximo}.`);
    }

    return numero;
}

export function texto(valor, campo, maximo) {
    if (typeof valor !== 'string' || !valor.trim() || valor.trim().length > maximo) {
        throw new ErroHttp(400, `${campo} deve conter de 1 a ${maximo} caracteres.`);
    }

    return valor.trim();
}

export function altura(valor) {
    if (!['number', 'string'].includes(typeof valor) ||
        !/^\d{1,5}(\.\d{1,2})?$/.test(String(valor)) || Number(valor) <= 0) {
        throw new ErroHttp(400, 'Informe uma altura em cm entre 0.01 e 99999.99, com até duas casas decimais.');
    }
    
    return valor;
}
