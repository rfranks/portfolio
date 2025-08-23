package utils

import "math/rand"

var Die = []int{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20}

func Max(x, y int) int {
	if x > y {
		return x
	}
	return y
}

func Min(x, y int) int {
	if x < y {
		return x
	}
	return y
}

func RollDice() int {
	return RollInt(Die)
}

func RollInt(ints []int) int {
	return ints[rand.Intn(len(ints))]
}
