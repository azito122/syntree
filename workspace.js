function Workspace() {
	this.svg = $("#workspace");
	
	this.idRef = 100;
	this.genId = function() {
		this.idRef++;
		return this.idRef;
	}

	this.page = new Page(this.genId(), this);
	var page = this.page;
	
	$(document).on('click', '.node-label', function(){
		page.eventNodeClick(this);
	});
	
	$(document).on('keydown', function(e) {
		if (e.keyCode === 13) {
			page.eventEnter();
		} else if (e.keyCode === 37) {
			page.eventLeft();
		} else if (e.keyCode === 38) {
			page.eventUp();
		} else if (e.keyCode === 39) {
			page.eventRight();
		} else if (e.keyCode === 40) {
			page.eventDown();
		} else if (e.keyCode === 46) {
			page.eventDel();
		} else if (e.keyCode === 27) {
			page.eventEsc();
		}
	})
	
	$(document).on('input', '.editor', function() {
		page.eventEditorTyping();
	});
}
