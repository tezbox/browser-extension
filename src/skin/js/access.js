var sender, loaded = false, tbsettings = JSON.parse(localStorage.getItem('tbsetting'));
chrome.storage.local.get("promptData", function (data) {
	sender = data.promptData;
	document.getElementById("sender").innerHTML = sender;
	loaded = true;
	document.getElementById("loader").style.display = "none";
	document.getElementById("main").style.display = "block";
});

document.getElementById("whitelist").onclick = function(){
	if (!loaded) return false;
	tbsettings.whitelist.push(sender);
	localStorage.setItem('tbsetting', JSON.stringify(tbsettings));
	chrome.runtime.sendMessage({ action : "tbapiResult", method: "access", data: {success : true} });
	window.close();
};
document.getElementById("reject").onclick = function(){
	if (!loaded) return false;
	chrome.runtime.sendMessage({ action : "tbapiResult", method: "access", data: {success : false, error : "Rejected"} });
	window.close();
};
document.getElementById("blacklist").onclick = function(){
	if (!loaded) return false;
	tbsettings.blacklist.push(sender);
	localStorage.setItem('tbsetting', JSON.stringify(tbsettings));
	chrome.runtime.sendMessage({ action : "tbapiResult", method: "access", data: {success : false, error : "Blacklisted"} });
	window.close();
};