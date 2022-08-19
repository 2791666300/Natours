import '@babel/polyfill'
import { login } from './login'
import { displayMap } from './mapbox'
import { logout } from './login'
import { updateSettings } from './updateSettings'
import { bookTour } from './stripe'

const mapBox = document.getElementById('map')

// 登录
const loginForm = document.querySelector('.form--login')

// 登出
const logOutBtn = document.querySelector('.nav__el--logout')


// 更新数据
const userDataForm = document.querySelector('.form-user-data')

// 更改密码
const userPasswordForm = document.querySelector('.form-user-password')

// 账单会话
const bookBtn = document.getElementById('book-tour');
if(mapBox) {

    const locations = mapBox.dataset.locations;
    displayMap(locations)
}

// 登录
if(loginForm){

    loginForm.addEventListener('submit', e => {
        e.preventDefault()
        const email = document.getElementById('email').value
        const password = document.getElementById('password').value
        login(email, password)
    })
}

// 登出
if (logOutBtn) logOutBtn.addEventListener('click', logout);

// 更改数据
if (userDataForm) userDataForm.addEventListener('submit', e => {
    e.preventDefault();

    // const name = document.getElementById('name').value
    // const email = document.getElementById('email').value
    // updateSettings({name, email}, '数据')

    // 1、创建一个空表单对象
    const form = new FormData()

    form.append('name', document.getElementById('name').value )
    form.append('email', document.getElementById('email').value )

    if(document.getElementById('photo').files[0]){

        form.append('photo', document.getElementById('photo').files[0] )
    }

    updateSettings(form, '数据')
});


// 更改密码
if (userPasswordForm) userPasswordForm.addEventListener('submit', async e => {
    e.preventDefault();

    document.querySelector('.btn--save-password').innerHTML = '正在更新……'
    const passwordCurrent = document.getElementById('password-current').value
    const password = document.getElementById('password').value
    const passwordConfirm = document.getElementById('password-confirm').value
    await updateSettings({passwordCurrent, password, passwordConfirm}, '密码')

    // 密码更新成功后重置输入框
    document.querySelector('.btn--save-password').innerHTML = '保存密码'
    document.getElementById('password-current').value = ''
    document.getElementById('password').value = ''
    document.getElementById('password-confirm').value = ''

})

if(bookBtn) 
    bookBtn.addEventListener('click', e=> {
        e.target.textContent = 'Processing....';
        const tourid = e.target.detaset;
        bookTour(tourid)
    })
