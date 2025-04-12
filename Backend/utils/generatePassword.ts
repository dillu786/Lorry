export const generatePassword=()=>{
    const alphabets = "asdfghjklqwertyuiopzxcvbnm";
    const numbers = "1234567890"
    const specialChars = "!@#$%^&*())))"
    let password = "";
    let length=8;
    for (let i =0 ; i< 4;i++){
      password += alphabets[Math.floor(Math.random()*26)];
    }
    for(let i=0; i<2;i++){
      password +=numbers[Math.floor(Math.random()*10)];
    }
    for(let i=0;i<2;i++){
      password += specialChars[Math.floor(Math.random()*13)]
    }
    password = "123456789";
    return password;
  }
  