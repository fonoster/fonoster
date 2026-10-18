package node

// RoomLimit is the most rooms the node holds at once (Config.MaxRooms after defaults): what a
// registration's {sessions} template reports while the node is draining or full.
func (n *Node) RoomLimit() int { return n.cfg.MaxRooms }
