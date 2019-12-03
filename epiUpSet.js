console.log('epiUpSet.js loaded')

// style //
document.body.style.backgroundColor="gray"

// Box file call //
/*
x = await (await fetch('https://api.box.com/2.0/files/558252350024/content',{
	headers: {
		Authorization: `Bearer ${JSON.parse(localStorage.parms).access_token}`
}
})).json()
*/

epiUpSet=function(){
	// ini
	console.log(`epiUpSet fun at ${Date()}`)
}

epiUpSet.box2upset=async(id,parms)=>{
	var x = await (await fetch(`https://api.box.com/2.0/files/${id}/content`,{
		headers: {
			Authorization: `Bearer ${JSON.parse(localStorage.parms).access_token}`
	}})).json()
	console.log(`loaded ${x.length} rows x ${Object.keys(x[0]).length} columns`)
	epiUpSet.dt=x
	epiUpSet.tab={} // tabular data
	var xx=Array(x.length)
	Object.keys(x[0]).forEach(k=>{
		epiUpSet.tab[k]=[...Array(x.length)].map(_=>[])
		epiUpSet.tab[k]=epiUpSet.tab[k].map((_,i)=>{
			return x[i][k]
		})
		// tabulate values
		debugger
	})
	// extract parms
	parms=parms||[]
	//debugger
	return x
	//debugger
}

epiUpSet()