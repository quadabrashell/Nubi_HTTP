export default function Awaiter(fn, ...args): Promise<any> {
    return new Promise((resolve, reject) => fn(...args, (err, result?) => err ? reject(err) : resolve(result)))
}
