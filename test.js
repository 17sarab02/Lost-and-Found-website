const fs = require('fs')

a = async ()=> {
    category = 'file1.txt'
    paths = ['file1.txt', 'file2.txt', 'file3.txt', 'file4.txt']
    console.log(paths.filter((value, index, arr)=>{ return value!= category}))
}

a()